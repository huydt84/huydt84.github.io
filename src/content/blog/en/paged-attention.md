---
locale: en
title: "PagedAttention, the idea behind vLLM"
description: About PagedAttention, the algorithm behind vLLM
pubDate: 2026-07-01
tags: [attention, AI, kv-cache, optimization]
draft: false
---

PagedAttention [1](#references) is one of the key ideas behind high-throughput LLM serving systems such as vLLM. It does not change the Transformer architecture. It does not remove the need to compute attention. Instead, it changes how the KV cache is stored and managed during inference.

# 1. Prerequisites
To fully understand KV caching, we need to be familiar with these concepts:
- Transformer Architecture
- Basic Linear Algebra
- KV Caching. You can check [my blog post](/blog/kv-cache-basic-explanation/) for a detailed explanation.

# 2. What Is PagedAttention?
## 2.1. Nature of LLM Serving
In serving, many users send requests at the same time. Each request may have a different prompt length, output length, stopping condition, and sampling strategy. Some requests finish quickly. Some continue generating for a long time. Some still wait for their turn to be processed.

So the server needs to manage many growing and shrinking KV caches at once. This is where memory fragmentation becomes a serious problem.

Imagine a scenario where you serve 1000 concurrent requests. As the [previous blog post](/blog/kv-cache-basic-explanation/) explained, the allocated memory for KV cache depends on the length of the generated response, which you have no idea. To mitigate that, you pre-allocate space for maximum length, but the response turns out to be much shorter. 

It means for each requests, you may only use a fraction of the allocated memory for that requests. It leads to several problems: 
- Each request gets its own isolated block of memory, which can't be shared with other requests even if 1000 requests using the same system prompt (then have duplicate KV cache entries).
- The server may have a lot of free memory theoretically, but it cannot be used because it is scattered across many fragmented contiguous blocks.

## 2.2 The idea of PagedAttention
The main idea of **PagedAttention** is surprisingly simple:
> It splits the KV cache into fixed-size blocks, and uses a block table to map logical token positions to physical memory blocks.

The idea is very similar to virtual memory in operating systems, where the OS breaks the memory into fixed-size pages and uses a page table to map logical addresses to physical locations.

## 2.3. Simplified Demonstration
Sequence A logical blocks:
```
[logical block 0] [logical block 1] [logical block 2]
```

Block table:
```
logical block 0 → physical block 7
logical block 1 → physical block 2
logical block 2 → physical block 9
```

Physical memory:
```
block 0: used by another sequence
block 1: free
block 2: Sequence A
block 3: Sequence B
...
block 7: Sequence A
...
block 9: Sequence A
```

From the model’s point of view, Sequence A still has a continuous logical context. But physically, the KV cache can be scattered across memory. The attention kernel uses the block table to find the correct physical blocks during attention computation.

# 3. Why Does PagedAttention Help Inference?
PagedAttention helps inference mainly by improving KV cache memory utilization. You still need to compute the attention formula, it's not cheaper. 

The real benefit is that PagedAttention allows the server to fit more active sequences into GPU memory. More active sequences means larger continuous batches. Larger continuous batches mean better GPU utilization and higher throughput.

## 3.1 The old problem: contiguous KV allocation

Imagine a simple server that allocates one contiguous KV cache region per request, and it serves 1000 concurrent requests. 

As the [previous blog post](/blog/kv-cache-basic-explanation/) explained, the allocated memory for KV cache depends on the length of the generated response, which you have no idea. The model may generate 32 tokens, 512 tokens, or 4096 tokens. If the server reserves too little memory, it may need to reallocate. If it reserves too much memory, memory is wasted.

A naive server might allocate memory like this:
```
request 1: reserve max 4096 tokens
request 2: reserve max 4096 tokens
request 3: reserve max 4096 tokens
...
```

That creates **internal fragmentation** (or **over-reservation**) during the request. This waste exists inside a live allocation, which means the request is still running, but much of the reserved KV cache is unused:
```
reserved memory: 4096 tokens
actually used: 300 tokens
wasted: 3796 tokens
```

There is also a separate problem: **external fragmentation**. Suppose GPU KV memory is divided like this, which 4 requests are using:

```
Memory: [ A ][ B ][ C ][ D ] 
```

Then request `B` finishes, and request `D` finishes:

```
Memory: [ A ][   ][ C ][   ] 
```

The total free memory is two chunks, but the largest contiguous free region is only one chunk. A new request that needs two contiguous chunks cannot fit, even though the total free memory is technically enough. 

Therefore, if the KV cache for each request must be contiguous, external fragmentation can make usable memory smaller than total free memory

**PagedAttention reduces both problems. It avoids reserving one large maximum-length KV region per request, and it avoids requiring one sequence’s logical KV cache to live in one contiguous physical memory region.**

> Sounds familiar? This is a classic problem in memory management, and it’s why techniques like paging and segmentation are used in operating systems.

## 3.2 PagedAttention reduces fragmentation, 
**PagedAttention** avoids the need to reserve one giant contiguous region. Instead, it allocates small fixed-size (default of **vllm** is 16) KV blocks as needed.

For example: A request with 50 tokens needs 4 blocks, with the first 3 blocks store full 16 tokens, and the last block stores only 2 tokens. **So memory waste happens only in the final block of each sequence.**

With block size `B`, a sequence wastes at most `B - 1` tokens worth of KV cache. This is much better than reserving memory for `max_seq_len` for every request.

*More available KV memory means more active sequences fit, server admits more requests, throughput improves.*

## 3.3. PagedAttention also cache KV accross requests
In LLM downstream applications, there can be multiple requests with the same system prompt, hence there KV cache entries are duplicated.

A naive system may duplicate the prompt KV cache for every sample. PagedAttention can share physical KV blocks between sequences. Multiple logical sequences can point to the same physical blocks. When a sequence needs to modify or extend the cache, the system can use reference counting and copy-on-write.

The [vLLM blog](https://vllm.ai/blog/2023-06-20-vllm) describes this block sharing mechanism and notes that it reduces memory overhead for parallel sampling, beam search, and prefix reuse.

Conceptually, this is similar to how operating systems share memory pages between processes.

# 4. Trade-offs
PagedAttention is powerful, but it is not free.
## 4.1. More complex attention kernels
A normal attention kernel can assume contiguous KV memory.

PagedAttention needs block-table lookup and non-contiguous memory access. That makes the kernel more complex.

The vAttention paper [2](#reference) explicitly points out that PagedAttention changes the KV cache virtual memory layout from contiguous to non-contiguous, which can introduce programming and performance overheads.

## 4.2. Possible gather overhead
Because KV blocks are not physically contiguous, the kernel may need to gather data from different memory locations. This can hurt memory coalescing if implemented poorly. High-performance PagedAttention requires *careful layout design that heavily depends on hardware architecture.*

PagedAttention is not something you get by simply storing KV tensors in a Python list. The allocator and kernel must be co-designed.

## 4.3. Block size tuning
If the block size is too small:
- More block table entries
- More metadata overhead
- More lookup overhead

If the block size is too large:
- More waste in the last block
- Less flexible memory allocation

The block size is therefore a trade-off between memory efficiency and kernel/runtime overhead.

# 5. Conclusion
PagedAttention is best understood as virtual memory for KV cache.

Traditional LLM serving struggles because each request has a KV cache that is large, dynamic, and hard to allocate efficiently. If the server over-reserves KV memory or requires contiguous allocation, memory fragmentation limits the number of active requests. That directly limits batching and throughput.

PagedAttention fixes this by splitting KV cache into fixed-size blocks. Each sequence has a logical block table, and the physical blocks can live anywhere in GPU memory. New blocks are allocated only when needed. Memory waste is mostly limited to the final block of each sequence.

The result is not that attention math disappears. The result is that the inference server can keep more sequences alive, batch more decode steps together, and use the GPU more effectively.

That is why PagedAttention matters: it turns KV cache from a fragile, contiguous allocation problem into a flexible block-management problem. For production LLM serving, that difference is often the difference between a slow, memory-bound server and a high-throughput inference engine.

## Reference
[1] Kwon, W., Li, Z., Zhuang, S., Sheng, Y., Zheng, L., Ying, C., ... & Shen, H. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention. In Proceedings of the 29th Symposium on Operating Systems Principles (SOSP).

[2] Prabhu, R., Nayak, A., Mohan, J., Ramjee, R., & Panwar, A. (2024). vAttention: Dynamic Memory Management for Serving LLMs without PagedAttention. arXiv preprint arXiv:2405.04437.