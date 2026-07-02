---
locale: en
title: "Batching in modern systems"
description: Batching in modern systems
pubDate: 2026-07-01
tags: [AI, batching, optimization]
draft: false
---

In model serving, batching means grouping multiple incoming requests together before sending them to the model worker.

The simplest server does this:
```
request 1 → model worker 
request 2 → model worker 
request 3 → model worker
```

A batching server does this:
```
request 1 \ 
request 2 → batch → model worker 
request 3 /
```

Basically, the idea seems very simple at first glance: put many requests together, then run the model once. However, when designing a batching system, there are many questions to answer, such as:
- When should the batch run?
- Which requests can be grouped together? 
- Where should requests wait? 
- How large can the batch be? 
...

> Batching should be considered as a server-side scheduling problem, with **timing**, **compatibility rules**, **queueing**, **batch size**, and **worker selection** as the main factors to consider.

# 1. Why Batching Matters
GPUs are good at parallel computation. If we send only one small request at a time, the GPU may not have enough work to do.

For example, one embedding request may contain only one short sentence. Running it alone can waste GPU capacity. If the server groups many small requests into one batch, the model can process them together and throughput improves.

This is a simple trade-off: the server may introduce some latency to wait for more requests to arrive, but the overall throughput improves. **So batching is only useful when the server can form a good batch without making requests wait too long.**

# 2. Batch Timing
The first question is:
> When should the batch run?

This is the most common meaning of “batching strategy”.

## 2.1. No Batching
No batching means every request is sent to the model worker immediately.
```
request 1 → model worker 
request 2 → model worker 
request 3 → model worker
```

This is useful for debugging, local inference/low-traffic scenarios, and latency-sensitive paths.

However, the downside is poor GPU utilization. If each request is small, the worker may spend too much time running tiny jobs.

## 2.2. Client-Side / Static Batching
Client-side batching means the client already sends many inputs in one request.

```
{ 
    "input": [ 
        "first sentence", 
        "second sentence", 
        "third sentence" 
    ] 
}
```

In this case, the server does not combine independent user requests. The client already created the batch. This is often called *static batching* because the batch is already formed before it reaches the server [1](#references).

This is the common approach for embedding, reranking, classification, and other tasks where the client can easily create a batch. It is also the case for offline inference, where the client can prepare a batch of inputs in advance.

Client-side batching is useful, but it is not enough for online serving. In online serving, requests arrive from different users at different times, so **the server still needs its own batching logic.**

## 2.3. Server-Side / Dynamic Batching
Dynamic batching means the server keeps a queue and creates batches from independent requests that arrive at runtime.

A simplified dynamic batcher looks like this:
```
while True:
    wait for requests to arrive
    put the requests in a queue
    dynamic batcher forms a batch from the queue
    send the batch to the model worker
```

NVIDIA Triton defines dynamic batching as a server feature that combines inference requests so a batch is created dynamically [2](#references)

A dynamic batcher usually has controls like: maximum batch size, maximum queue delay, priority levels, queue policy... They will be further discussed later in this post.

## 2.4. Continuous / In-Flight Batching
Decoder-only LLM serving is naturally different. A chat completion request does not finish after one forward pass. The model generates one token, then another token, then another token. Some requests finish quickly. Some continue for hundreds or thousands of tokens.

If the server waits for every request in a batch to finish, short requests finish early but the batch is still blocked by the longest request. **Continuous batching solves this by letting the active batch change over time.**

Example:
```
step 1: A B C 
step 2: A B C 
step 3: A   C D 
step 4:     C D E
...
```

As you can see, the batch changes over time.
- Requests `A` and `B` finish early, so they leave the batch.
- Request `D` arrives and joins the batch after request `B` finished. 
- Request `E` arrives later and joins the batch after request `A` finished.

The server does not wait for all requests to finish before moving on.

This idea has multiple names: ORCA described this as *iteration-level scheduling*, where scheduling happens at the generation-iteration level instead of the whole-request level [3](#references). TensorRT-LLM uses the term *in-flight batching* or *continuous batching* for a similar idea [4](#references).

# 3. Compatibility Rules
The second question is:
> Which requests can be grouped together?

Not every request can be batched with every other request. The batching system needs compatibility rules.

## 3.1. Same Model
The most basic rule is that requests must use the same model.

```
Llama requests → Llama batch
Qwen requests → Qwen batch 
BERT requests → BERT batch
```

A multi-model server usually keeps separate queues or workers for different models. This works especially well if the server uses different model with different tasks and architectures, e.g. Qwen for chat, BERT for classification, Whisper for ASR.

## 3.2 Length Compatibility
For text models, input length matters.

```
request A: 8 tokens 
request B: 12 tokens 
request C: 20 tokens 
request D: 1024 tokens
```

If the model pads every request to the longest request, the first three requests waste a lot of computation.

The important idea is:
> Do not group very short and very long requests if padding waste becomes too large.

A common solution is to group requests with similar "length groups" (buckets) together:
```
bucket 1: 1-16 tokens → batch 1
bucket 2: 17-32 tokens → batch 2
...
bucket 64: 1009-1024 tokens → batch 64
...
```

## 3.3. Runtime Option Compatibility
Some runtime options may affect whether requests can be grouped efficiently.
- streaming vs non-streaming
- structured output mode vs text output mode
- sampling mode: greedy vs beam search
- Input/output modality
- ...

Some engines can mix these options in one batch, some engines cannot. The server needs to know which options are safe to mix to create a batch.

## 3.4. Adapter Compatibility
**LoRA** serving adds another compatibility problem: *Many users may share the same base model but use different adapters.*

A simple server may require one batch to use one adapter:
```
base model A + adapter X → batch 1 
base model A + adapter Y → batch 2
```

More advanced systems can batch different adapters together. SGLang documents support for serving multiple LoRA adapters for different sequences in a single batch [5](#references).

## 3.5. Prefix Affinity
Many LLM applications reuse the same prefix: system prompt, tool description, conversation history, evaluation,...

If many requests share similar prefixes or cache state, the server may benefit from grouping or routing them together; especially with **in-batch prefix caching** support.

# 4. Queues
The third question is:
> Where do requests wait before they become a batch?

Of course the answer is a **queue**, but *queue design matters because it decides what batches are possible.*

## 4.1. One Global Queue
The simplest design is one queue for all requests.
```
all requests → global queue → batcher
```

This is easy to build, but it can cause *head-of-line blocking*. For example, a long request or low-priority request may sit in front of short urgent requests.

## 4.2. Per-Model Queue
A multi-model server often uses one queue per model. This avoids mixing incompatible models and makes model-specific batching easier. 

This is, of course, follow perfectly the [Same model](#31-same-model) compatibility rule mentioned earlier.

## 4.3. Per-Priority Queue
Production systems often separate traffic classes. 
- realtime user request > offline ingestion job 
- paid user > free user 
- production traffic > experiment traffic

Triton’s scheduler documentation includes priority levels and queue policies for dynamic batching [2](#references)

## 4.4. Per-Tenant Queue
In a shared system, one tenant should not be able to dominate the whole server. 

A server may keep separate queues or accounting per tenant, Then the scheduler can apply quotas or weighted fairness.

# 5. Batch Limits
The fourth question is:
> How large can the batch be, and when should the server stop waiting?

This is where the scheduler controls the latency-throughput trade-off.

## 5.1. Max Batch Size
The simplest limit is request count. The batch size cannot exceed a pre-defined number.

But request count alone is not enough. A batch of 32 short requests is very different from a batch of 32 long requests.

## 5.2. Wait Limit
[Dynamic batching](#23-server-side--dynamic-batching) usually waits for a short time to collect more requests.

This is the *latency-throughput knob*. If the wait time is too short, the server may create tiny batches and waste GPU capacity. If the wait time is too long, users feel extra latency.

Therefore, the practical rule is making the number flexible based on situations: For offline jobs, the server can wait longer to form larger batches. For interactive requests, the server may need to run a smaller batch immediately.

## 5.3. Token and Memory Budget
For text models, request count is often too rough. A batch of 32 requests with 10 tokens each is very different from a batch with 4096 token each requests. So a better batching system often uses a token budget: `sum(input_tokens) <= token_budget`

For decoder LLMs, the server also needs to think about output tokens and KV cache memory, since KV cache memory is directly proportional to number of output tokens.

vLLM exposes `max_num_batched_tokens`, the maximum number of tokens processed in one iteration, and `max_num_seqs`, the maximum number of sequences processed in one iteration [6](#references). 

Reducing `max_num_seqs` or `max_num_batched_tokens` reduces the number of concurrent requests in a batch and obviously requires less KV cache space

# 6. Practical Checklist
When designing a batching system, these questions should be answered clearly
## 6.1. Do we need batching?
Batching is not free. It improves throughput by grouping requests together, but it can also add queueing delay and implementation complexity.

Batching may not be worth it when:
- Traffic is very low
- Latency is more important than throughput
- The model is already saturated by single requests
- Requests are too heterogeneous to group well
- CPU preprocessing, network, storage, or database calls are the real bottleneck
## 6.2. Is the workload one-shot or iterative?
- If the model runs once per request: dynamic batching is usually enough. Example: embedding, reranking, classification, image feature extraction,...
- If the model generates token by token: continuous batching is usually needed. The common example is decoder LLM generation

## 6.3. Who creates the batch?
- If the client already has many inputs, use client-side / static batching.
- If independent online requests arrive over time, the server needs dynamic batching.

## 6.4. Which requests are safe and useful to group?
Compatibility check:
- Same model or endpoint
- Similar input length / request cost
- Compatible runtime options
- Compatible adapter state
- Useful prefix/cache affinity

However, waiting too long to achieve perfect compatibility can increase latency. If the batcher keeps delaying execution to find better matches, requests may spend too much time in the queue.

Group requests that can run together efficiently, but do not delay execution so much that latency degrades.

## 6.5. Where should requests wait?
The queue defines which requests are visible to the batcher.

Start simple with 1 global queue. In most cases, it is totally fine.

Only split when there is a real reason:
- *Per-model queue*: avoid mixing different models
- *Priority queue*: protect realtime traffic from offline jobs
- *Tenant queue*: prevent one tenant from dominating the server

**Do not turn every grouping rule into a new queue**. For example, similar length is a grouping rule. It can be implemented with separate length queues, but it can also be implemented with one queue and length-aware selection.

## 6.6. What is the real batch limit?
Only requests counting is not enough. A batch limit can be:
- Maximum wait time
- Maximum context memory (sequence, token, KV cache)
- Latency target / SLO
- Tenant/class quota

For simple encoder models, max batch size and max wait time may be enough. For LLM serving, token and memory limits matter more.

## 6.7. What can go wrong?
Every batching design has a failure mode.
- `client-side / static batching`: good for offline jobs, not enough for independent online traffic
- `dynamic batching`: can add queueing latency
- `continuous batching`: more complex memory, cancellation, and fairness handling
- `length-aware grouping`: rare length groups may wait longer
- `priority rules`: low-priority traffic may starve
- `tenant queues`: too much isolation can reduce batch fill rate
- `adapter-aware grouping`: may reduce batch fill rate if adapters are too fragmented
- `prefix-aware grouping`: may reduce batch size while improving cache locality


# 7. Conclusion

Modern batching is not just “put more requests into one batch”. It is the policy for grouping incoming requests into executable work.

> The goal should not be to maximize batch size blindly. The goal is to find the best trade-off between **throughput, latency, memory, fairness, implementation complexity**


# References
[1] Salesforce Engineering. “Benchmarking Triton (TensorRT) Inference Server for Hosting Transformer Language Models.” https://www.salesforce.com/blog/benchmarking-tensorrt-inference-server/

[2] NVIDIA Triton Inference Server Documentation. “Batchers.” https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html#dynamic-batcher

[3] Gyeong-In Yu, Joo Seong Jeong, Geon-Woo Kim, Soojeong Kim, and Byung-Gon Chun. “Orca: A Distributed Serving System for Transformer-Based Generative Models.” [OSDI 2022.](https://www.usenix.org/conference/osdi22/presentation/yu)

[4] NVIDIA TensorRT-LLM Documentation. "Paged Attention, IFB, and Request Scheduling." https://nvidia.github.io/TensorRT-LLM/features/paged-attention-ifb-scheduler.html#in-flight-batching

[5] SGLang Documentation. “LoRA Serving.” https://sgl-project-sglang-93.mintlify.app/advanced/lora

[6] vLLM Documentation. “SchedulerConfig.”
https://docs.vllm.ai/en/latest/api/vllm/config/scheduler/