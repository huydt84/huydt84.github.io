---
locale: ja
title: "KVキャッシュの基本解説"
description: これは私の最初のブログ記事で、KVキャッシュの基本的な考え方を紹介します
pubDate: 2026-06-28
tags: [attention, AI, kv-cache, optimization]
draft: false
---

（この記事は OpenAI の GPT-5.4 によって翻訳されています。英語の原文は [こちら](/blog/kv-cache-basic-explanation/) をクリックしてください。翻訳に問題があれば、記事の最後から気軽にコメントしてください。）

現代の GPT 系言語モデルは、自己回帰的にテキストを生成します。つまり、一度に 1 トークンずつ生成していきます。各ステップでモデルは、それまでのすべてのトークンを読み取り、次のトークンを予測します。

典型的な例:
- あるステップでは、モデルは "The cat sat on the" を読み取り、次のトークンとして "mat" を予測します。
```
Model Input: The cat sat on the
Model Output: mat
```

- 次のステップでは、モデルは "The cat sat on the mat" を読み取り、次のトークンとして "and" を予測します。
```
Model Input: The cat sat on the mat
Model Output: and
```

単純に考えると、新しいトークンが生成されるたびに、モデルは毎回最初からすべてを再計算することもできます。しかし、それでは非常に非効率です。その代わり、現代のモデルは **KV caching** という手法を使って中間結果を保存し、重複計算を避けます。

> **KV caching** の要点を一言でいうと、過去のすべてのトークンについて attention 機構の key-value ペアを記憶しておき、新しいトークンが生成されたときにそれらを最初から再計算せず再利用する、ということです。

なぜこれが成り立つのかを理解するには、attention の数式の中身を見る必要があります。

# 1. 前提知識
KV caching をしっかり理解するには、次の概念に慣れている必要があります。
- Transformer Architecture
- Basic Linear Algebra

# 2. Transformer Decoder が Attention をどう計算するか
GPT 系モデルは Transformer decoder であり、多数の *Transformer blocks* と呼ばれるブロックを含みます。
初期のアーキテクチャでは [1](#references)、各ブロックは self-attention ブロックと feed-forward ブロックで構成されています。

self-attention の内部では、各トークン表現が 3 つのベクトルに射影されます。

1. **Query (Q)**: 現在のトークンの情報を表します。
2. **Key (K)**: 文脈中のすべてのトークンの情報を表します。
3. **Value (V)**: 文脈中のすべてのトークンの実際の内容を表します。

入力 hidden state 行列 $X \in \mathbb{R}^{\text{seq\_len} \times d_{\text{model}}}$ に対して、モデルは次を計算します。

$$
\begin{aligned}
Q &= X W_Q \\
K &= X W_K \\
V &= X W_V
\end{aligned}
$$

ここで:

$$
\begin{aligned}
W_Q &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}} \\
W_K &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}} \\
W_V &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}}
\end{aligned}
$$

1 つの attention head に対する scaled dot-product attention は次の通りです。

$$
\operatorname{Attention}(Q, K, V) =
\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_{\text{head}}}}\right)V
$$

decoder-only 言語モデルでは、attention は causal です。つまり、トークン *i* は *1...i* のトークンにしか attention できず、未来のトークンを見ることはできません。

そのため、トークン *t* に対する attention 出力は次のようになります。

$$
\begin{aligned}
q_t &= x_t W_Q \\
k_i &= x_i W_K \\
v_i &= x_i W_V
\end{aligned}
$$

attention score は、query と keys のドット積を head 次元の平方根でスケーリングして計算されます。

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

その後、self-attention 層の出力は values の重み付き和として計算されます。

$$
\begin{aligned}
\operatorname{attention\_weights}_t &= \operatorname{softmax}(\operatorname{attention\_scores}_t) \\
\operatorname{output}_t &= \sum_i \operatorname{attention\_weights}_t[i] \, v_i
\end{aligned}
$$

# 3. なぜ K と V を再利用できるのか

$output_t$ の式を見ると、次のことが分かります。

**時刻 $t$ の出力は、過去のすべての $q_1, q_2, \ldots, q_{t-1}$ を使います。同様に、$v_1, v_2, \ldots, v_{t-1}$ も使います。**

なぜこれが Transformer Decoder モジュールでのみ成り立つのか:
- causal masking を使っているからです。古いトークンは新しいトークンを見ることができません。Token $1$ は token $t+1$ に attention できません。Token $2$ も token $t+1$ に attention できません。Token $t$ も token $t+1$ に attention できません。
- BERT 系のような encoder-only モデルでは、すべてのトークンが他のすべてのトークンに attention できるため、同じ形では keys と values を再利用できません。

この性質があるので、過去のすべてのトークンの key-value ペアを cache に保存できます。新しいトークンを生成するとき、モデルは keys と values を再計算する代わりに、cache から参照するだけで済みます。

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

各ステップで必要なのは、$Q_{t+1}$、$K_{t+1}$、$V_{t+1}$ を計算し、それらを cache に連結することだけです。

```
K_cache.append(K_{t+1})
V_cache.append(V_{t+1})
```

そして、新しいトークンに対してのみ attention を計算します。

$$
output_{t+1} = \operatorname{softmax}\left(\dfrac{q_{t+1} \cdot K_{cache}^T}{\sqrt{d_{head}}}\right) \cdot V_{cache}
$$

# 4. KV Cache は Compute と Memory のトレードオフ

KV cache は compute を節約しますが、その代わりに memory を消費します。

標準的な multi-head attention モデルでは、KV cache のメモリ量はおおよそ次のようになります。

$$
\begin{aligned}
\text{KV\_cache\_bytes} &= \text{batch\_size} \times \text{num\_layers} \times \\
&\quad \text{seq\_len} \times 2 \times \\
&\quad \text{num\_kv\_heads} \times \text{head\_dim} \times \\
&\quad \text{bytes\_per\_element}
\end{aligned}
$$

各変数の意味:
- batch_size: 並列に処理される系列の数
- num_layers: transformer モデル内のブロック数
- seq_len: 入力系列の長さ
- num_kv_heads: attention head の数
- head_dim: 各 attention head の次元
- bytes_per_element: 各要素の保存に必要なバイト数（例: float32 なら 4）
- $2$: key と value の両方を保存するため

実際の値として、Hugging Face の **GPT-2 XL** の設定を代入してみましょう。 [2](#references) [3](#references)

**GPT-2 XL の設定:**

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

**Step 2 - 全レイヤーを通した 1 トークンあたりの KV cache 要素数:**

$$
\begin{aligned}
\text{elements per token} &= n_{\text{layer}} \times 2 \times n_{\text{head}} \times d_{\text{head}} \\
&= 48 \times 2 \times 25 \times 64 \\
&= 153,\!600
\end{aligned}
$$

**Step 3 - 1 シーケンス全体（1024 トークン）:**

$$
\begin{aligned}
\text{elements per sequence} &= 153,\!600 \times 1024 \\
&= 157,\!286,\!400
\end{aligned}
$$

**Step 4 - batch size 4、fp16（2 bytes/element）で保存する場合:**

$$
\begin{aligned}
\text{KV cache memory} &= 157,\!286,\!400 \times 4 \times 2 \\
&= 1,\!258,\!291,\!200 \text{ bytes} \\
&\approx 1.17 \text{ GB}
\end{aligned}
$$

比較のために、モデル本体は約 1.5B パラメータを持っています。fp16 では:

$$
\text{model weights} \approx 1.5 \times 10^9 \times 2 = 3 \text{ GB}
$$

この batch size では、KV cache により **約 40%** のメモリオーバーヘッドが追加されます。

> 重いと感じますか？ 実際、production-grade な推論エンジン（vllm/sglang）は KV cache 管理に対して多くの最適化を行っており、メモリ使用量を大幅に削減できることがよくあります。

# 5. 結論
KV cache は、LLM inference における最も重要な最適化の 1 つです。

KV cache がなければ、生成されるトークンごとに、コンテキスト全体に対する attention を毎回最初から再計算しなければなりません。これは膨大な compute の無駄です。KV cache は、過去のトークンの key-value ペアを保存することでこれを緩和し、新しいトークンに対してその情報を再利用できるようにします。

KV cache が機能する理由は causal masking にあります。つまり、トークンは自分自身と過去のトークンにしか attention できず、未来のトークンには attention できません。

ただし、KV cache は万能ではありません。これは典型的なシステム上のトレードオフです。**Memory を節約する代わりに、Compute を払う。**

このトレードオフは、continuous batching、paged attention、prefix caching、KV-aware routing、prefill/decode disaggregation を含む、多くの LLM serving 技術の土台になっています。

## References

[1] Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, and Illia Polosukhin. "Attention Is All You Need." Advances in Neural Information Processing Systems 30 (2017). arXiv:1706.03762.

[2] Hugging Face, OpenAI. "GPT-2 Model Card." https://huggingface.co/openai-community/gpt2-xl

[3] Alec Radford, Jeffrey Wu, Rewon Child, David Luan, Dario Amodei, and Ilya Sutskever. "Language Models are Unsupervised Multitask Learners." OpenAI, 2019. https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
