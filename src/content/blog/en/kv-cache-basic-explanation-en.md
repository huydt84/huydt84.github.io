---
locale: en
title: "KV Cache: Basic Explanation"
description: This is my first blog, where I introduce basic idea behind KV cache
pubDate: 2026-06-28
tags: [attention, AI, kv-cache, optimization]
draft: false
---

Modern GPT-style language models generate text autoregressively: one token at a time. At every step, the model reads all previous tokens and predicts the next token.

Classic example:
- At one step, the model reads "The cat sat on the" and predicts "mat" as the next token.
```
Model Input: The cat sat on the
Model Output: mat
```

- At the next step, the model reads "The cat sat on the mat" and predicts "and" as the next token.
```
Model Input: The cat sat on the mat
Model Output: and
```

Naively, the model could recompute everything from the beginning every time a new token is generated. However, this would be highly inefficient. Instead, modern models use a technique called **KV caching** to store intermediate results and avoid redundant computations.

> The short idea of **KV caching** is to remember the key-value pairs of the attention mechanism for all previous tokens; so that when a new token is generated, the model can reuse these cached values instead of recalculating them from scratch.

To understand why this is true, we need to look inside the attention formula.

# 1. Prerequisites
To fully understand KV caching, we need to be familiar with these concepts:
- Transformer Architecture
- Basic Linear Algebra

# 2. How a Transformer Decoder Calculates Attention
A GPT-style model is a Transformer decoder which contains many blocks called *Transformer blocks*.
In the initial architecture [1](#references), each block contains a self-attention block and a feed-forward block.

Inside self-attention, each token representation is projected into three vectors:

1. **Query (Q)**: Represents the current token's information.
2. **Key (K)**: Represents the information of all tokens in the context.
3. **Value (V)**: Represents the actual content of all tokens in the context.

For an input hidden state matrix $X \in \mathbb{R}^{\text{seq\_len} \times d_{\text{model}}}$, the model computes:

$$
\begin{aligned}
Q &= X W_Q \\
K &= X W_K \\
V &= X W_V
\end{aligned}
$$

where:

$$
\begin{aligned}
W_Q &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}} \\
W_K &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}} \\
W_V &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}}
\end{aligned}
$$

For one attention head, scaled dot-product attention is:

$$
\operatorname{Attention}(Q, K, V) =
\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_{\text{head}}}}\right)V
$$

In a decoder-only language model, attention is causal. That means token *i* can only attend to tokens *1...i*, not future tokens.

So for token *t*, the attention output is:

$$
\begin{aligned}
q_t &= x_t W_Q \\
k_i &= x_i W_K \\
v_i &= x_i W_V
\end{aligned}
$$

Attention score is calculated as the dot product of the query and keys, scaled by the square root of the head dimension:

$$
\operatorname{attention\_scores}_t =
\frac{1}{\sqrt{d_{\text{head}}}}
\left[
q_t \cdot k_1,\;
q_t \cdot k_2,\;
\dots,\;
q_t \cdot k_t
\right]
$$

Then, the output of the self-attention layer is the weighted sum of the values:

$$
\begin{aligned}
\operatorname{attention\_weights}_t &= \operatorname{softmax}(\operatorname{attention\_scores}_t) \\
\operatorname{output}_t &= \sum_i \operatorname{attention\_weights}_t[i] \, v_i
\end{aligned}
$$

# 3. Why K and V Can Be Reused

From the formula of $output_t$, we can see that:

**The output at $t$ use all the previous $q_1, q_2, \ldots, q_{t-1}$, same for $v_1, v_2, \ldots, v_{t-1}$.**

Why this is only the case for Transformer Decoder modules: 
- It uses causal masking. Old tokens cannot see the new token. Token $1$ cannot attend to token $t+1$. Token $2$ cannot attend to token $t+1$. Token $t$ cannot attend to token $t+1$.
- For BERT-style models, which are encoder-only, all tokens can attend to all other tokens, so they cannot reuse keys and values in the same way.

Knowing this, we can store the key-value pairs for all previous tokens in a cache. When generating a new token, the model can simply look up the cached keys and values instead of recomputing them.

```
K_cache = [
    k_1,  # Key for token 1
    k_2,  # Key for token 2
    ...
    k_t   # Key for token t
]
V_cache = [
    v_1,  # Value for token 1
    v_2,  # Value for token 2
    ...
    v_t   # Value for token t
]
```

In each step, we only need to compute $Q_{t+1}$, $K_{t+1}$ and $V_{t+1}$, then we concat them to the caches:

```
K_cache.append(K_{t+1})
V_cache.append(V_{t+1})
```

and compute attention for the new token only:

$$
output_{t+1} = \operatorname{softmax}\left(\dfrac{q_{t+1} \cdot K_{cache}^T}{\sqrt{d_{head}}}\right) \cdot V_{cache}
$$

# 4. KV Cache is a Compute-Memory Tradeoff

KV cache saves compute, but it costs memory.

For a standard multi-head attention model, the KV cache memory is approximately:

$$
\begin{aligned}
\text{KV\_cache\_bytes} &= \text{batch\_size} \times \text{num\_layers} \times \\
&\quad \text{seq\_len} \times 2 \times \\
&\quad \text{num\_kv\_heads} \times \text{head\_dim} \times \\
&\quad \text{bytes\_per\_element}
\end{aligned}
$$

With: 
- batch_size: Number of sequences processed in parallel.
- num_layers: Number of blocks in the transformer model.
- seq_len: Length of the input sequences.
- num_kv_heads: Number of attention heads.
- head_dim: Dimension of each attention head.
- bytes_per_element: Number of bytes used to store each element (e.g., 4 for float32).
- $2$: Because we store both keys and values.

Let's plug in the actual configuration of **GPT-2 XL** from Hugging Face. [2](#references) [3](#references)

**GPT-2 XL config:**

$$
\begin{aligned}
d_{\text{model}} &= 1600 \\
n_{\text{head}} &= 25 \\
n_{\text{layer}} &= 48 \\
n_{\text{ctx}} &= 1024
\end{aligned}
$$

**Step 1 - head dimension:**

$$
d_{\text{head}} = \frac{d_{\text{model}}}{n_{\text{head}}} = \frac{1600}{25} = 64
$$

**Step 2 - KV cache elements for one token across all layers:**

$$
\begin{aligned}
\text{elements per token} &= n_{\text{layer}} \times 2 \times n_{\text{head}} \times d_{\text{head}} \\
&= 48 \times 2 \times 25 \times 64 \\
&= 153,\!600
\end{aligned}
$$

**Step 3 - one full sequence (1024 tokens):**

$$
\begin{aligned}
\text{elements per sequence} &= 153,\!600 \times 1024 \\
&= 157,\!286,\!400
\end{aligned}
$$

**Step 4 - batch of 4, stored in fp16 (2 bytes/element):**

$$
\begin{aligned}
\text{KV cache memory} &= 157,\!286,\!400 \times 4 \times 2 \\
&= 1,\!258,\!291,\!200 \text{ bytes} \\
&\approx 1.17 \text{ GB}
\end{aligned}
$$

For comparison, the model has ~1.5B parameters. In fp16:

$$
\text{model weights} \approx 1.5 \times 10^9 \times 2 = 3 \text{ GB}
$$

The KV cache adds **~40%** memory overhead at this batch size.

> Feel burden? In fact, production-grade inference engines (vllm/sglang) often employ heavy optimizations for KV cache management, which can significantly reduce memory usage.

# 5. Conclusion
KV cache is one of the most important optimizations in LLM inference.

Without KV cache, every generated token would require recomputing attention over the whole context again and again. That wastes a huge amount of compute. KV cache mitigates this by storing key-value pairs from previous tokens, allowing the model to reuse this information for new tokens.

The reason for KV cache to work is causal masking, which means tokens can only attend to themselves and previous tokens, not future ones.

However, KV cache is not a free lunch. It is a classic systems trade-off: **Save memory, pay with compute.**

This trade-off is the foundation of many LLM serving techniques, including continuous batching, paged attention, prefix caching, KV-aware routing, and prefill/decode disaggregation.

## References

[1] Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, and Illia Polosukhin. "Attention Is All You Need." Advances in Neural Information Processing Systems 30 (2017). arXiv:1706.03762.

[2] Hugging Face, OpenAI. "GPT-2 Model Card." https://huggingface.co/openai-community/gpt2-xl

[3] Alec Radford, Jeffrey Wu, Rewon Child, David Luan, Dario Amodei, and Ilya Sutskever. "Language Models are Unsupervised Multitask Learners." OpenAI, 2019. https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf



