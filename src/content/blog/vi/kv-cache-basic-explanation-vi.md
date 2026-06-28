---
locale: vi
title: "Giải thích cơ bản về KV cache"
description: Đây là bài blog đầu tiên của tôi, nơi tôi giới thiệu ý tưởng cơ bản đằng sau KV cache
pubDate: 2026-06-28
tags: [attention, AI, kv-cache, optimization]
draft: false
---

_(Bài viết này được dịch bởi GPT-5.4 của OpenAI. Để xem nội dung gốc bằng tiếng Anh, hãy nhấp [vào đây](/blog/kv-cache-basic-explanation/). Nếu gặp vấn đề với bản dịch, vui lòng để lại bình luận ở cuối bài viết)_

Các mô hình ngôn ngữ hiện đại kiểu GPT sinh văn bản theo cách tự hồi quy, nghĩa là mỗi lần sinh ra một token. Ở mỗi bước, mô hình đọc toàn bộ các token trước đó và dự đoán token tiếp theo.

Ví dụ quen thuộc:
- Ở một bước, mô hình đọc "The cat sat on the" và dự đoán "mat" là token tiếp theo.
```
Model Input: The cat sat on the
Model Output: mat
```

- Ở bước tiếp theo, mô hình đọc "The cat sat on the mat" và dự đoán "and" là token tiếp theo.
```
Model Input: The cat sat on the mat
Model Output: and
```

Nếu làm theo cách ngây thơ, mô hình có thể tính lại toàn bộ mọi thứ từ đầu mỗi khi một token mới được sinh ra. Tuy nhiên, điều này sẽ rất kém hiệu quả. Thay vào đó, các mô hình hiện đại dùng một kỹ thuật gọi là **KV caching** để lưu các kết quả trung gian và tránh tính toán lặp lại không cần thiết.

> Ý tưởng ngắn gọn của **KV caching** là ghi nhớ các cặp key-value của cơ chế attention cho tất cả token trước đó; nhờ vậy khi một token mới được sinh ra, mô hình có thể tái sử dụng các giá trị đã cache này thay vì phải tính lại từ đầu.

Để hiểu vì sao điều này đúng, chúng ta cần nhìn vào bên trong công thức attention.

# 1. Kiến thức nền
Để hiểu đầy đủ KV caching, chúng ta cần quen với các khái niệm sau:
- Transformer Architecture
- Basic Linear Algebra

# 2. Transformer Decoder tính Attention như thế nào
Một mô hình kiểu GPT là Transformer decoder, gồm nhiều khối gọi là *Transformer blocks*.
Trong kiến trúc ban đầu [1](#references), mỗi khối gồm một self-attention block và một feed-forward block.

Bên trong self-attention, biểu diễn của mỗi token được chiếu thành ba vector:

1. **Query (Q)**: Biểu diễn thông tin của token hiện tại.
2. **Key (K)**: Biểu diễn thông tin của tất cả token trong ngữ cảnh.
3. **Value (V)**: Biểu diễn nội dung thực tế của tất cả token trong ngữ cảnh.

Với ma trận hidden state đầu vào $X \in \mathbb{R}^{\text{seq\_len} \times d_{\text{model}}}$, mô hình tính:

$$
\begin{aligned}
Q &= X W_Q \\
K &= X W_K \\
V &= X W_V
\end{aligned}
$$

trong đó:

$$
\begin{aligned}
W_Q &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}} \\
W_K &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}} \\
W_V &\in \mathbb{R}^{d_{\text{model}} \times d_{\text{head}}}
\end{aligned}
$$

Với một attention head, scaled dot-product attention là:

$$
\operatorname{Attention}(Q, K, V) =
\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_{\text{head}}}}\right)V
$$

Trong một decoder-only language model, attention là causal. Điều đó có nghĩa là token *i* chỉ có thể attention tới các token *1...i*, chứ không thể nhìn các token ở tương lai.

Vì vậy với token *t*, attention output là:

$$
\begin{aligned}
q_t &= x_t W_Q \\
k_i &= x_i W_K \\
v_i &= x_i W_V
\end{aligned}
$$

attention score được tính bằng tích vô hướng giữa query và các key, rồi chia theo căn bậc hai của số chiều head:

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

Sau đó, đầu ra của lớp self-attention là tổng có trọng số của các value:

$$
\begin{aligned}
\operatorname{attention\_weights}_t &= \operatorname{softmax}(\operatorname{attention\_scores}_t) \\
\operatorname{output}_t &= \sum_i \operatorname{attention\_weights}_t[i] \, v_i
\end{aligned}
$$

# 3. Vì sao K và V có thể được tái sử dụng

Từ công thức của $output_t$, ta có thể thấy:

**Đầu ra tại thời điểm $t$ dùng tất cả các $q_1, q_2, \ldots, q_{t-1}$ trước đó, và tương tự với $v_1, v_2, \ldots, v_{t-1}$.**

Vì sao điều này chỉ đúng với các mô-đun Transformer Decoder:
- Vì nó dùng causal masking. Các token cũ không thể nhìn thấy token mới. Token $1$ không thể attention tới token $t+1$. Token $2$ không thể attention tới token $t+1$. Token $t$ cũng không thể attention tới token $t+1$.
- Với các mô hình kiểu BERT, vốn là encoder-only, mọi token đều có thể attention tới mọi token khác, nên chúng không thể tái sử dụng keys và values theo cùng cách này.

Biết được điều đó, ta có thể lưu các cặp key-value của tất cả token trước đó trong một cache. Khi sinh token mới, mô hình chỉ cần tra các keys và values đã cache thay vì tính lại chúng.

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

Ở mỗi bước, chúng ta chỉ cần tính $Q_{t+1}$, $K_{t+1}$ và $V_{t+1}$, sau đó nối chúng vào cache:

```
K_cache.append(K_{t+1})
V_cache.append(V_{t+1})
```

và chỉ tính attention cho token mới:

$$
output_{t+1} = \operatorname{softmax}\left(\dfrac{q_{t+1} \cdot K_{cache}^T}{\sqrt{d_{head}}}\right) \cdot V_{cache}
$$

# 4. KV Cache là sự đánh đổi giữa Compute và Memory

KV cache giúp tiết kiệm compute, nhưng đổi lại nó tốn memory.

Với một mô hình multi-head attention tiêu chuẩn, dung lượng bộ nhớ cho KV cache xấp xỉ là:

$$
\begin{aligned}
\text{KV\_cache\_bytes} &= \text{batch\_size} \times \text{num\_layers} \times \\
&\quad \text{seq\_len} \times 2 \times \\
&\quad \text{num\_kv\_heads} \times \text{head\_dim} \times \\
&\quad \text{bytes\_per\_element}
\end{aligned}
$$

Trong đó:
- batch_size: Số sequence được xử lý song song
- num_layers: Số block trong mô hình transformer
- seq_len: Độ dài chuỗi đầu vào
- num_kv_heads: Số attention head
- head_dim: Số chiều của mỗi attention head
- bytes_per_element: Số byte dùng để lưu mỗi phần tử (ví dụ: 4 cho float32)
- $2$: Vì ta lưu cả key và value

Hãy thay bằng cấu hình thực tế của **GPT-2 XL** từ Hugging Face. [2](#references) [3](#references)

**Cấu hình GPT-2 XL:**

$$
\begin{aligned}
d_{\text{model}} &= 1600 \\
n_{\text{head}} &= 25 \\
n_{\text{layer}} &= 48 \\
n_{\text{ctx}} &= 1024
\end{aligned}
$$

**Step 1 — số chiều của head:**

$$
d_{\text{head}} = \frac{d_{\text{model}}}{n_{\text{head}}} = \frac{1600}{25} = 64
$$

**Step 2 — số phần tử KV cache cho một token trên toàn bộ các layer:**

$$
\begin{aligned}
\text{elements per token} &= n_{\text{layer}} \times 2 \times n_{\text{head}} \times d_{\text{head}} \\
&= 48 \times 2 \times 25 \times 64 \\
&= 153,\!600
\end{aligned}
$$

**Step 3 — một sequence đầy đủ (1024 token):**

$$
\begin{aligned}
\text{elements per sequence} &= 153,\!600 \times 1024 \\
&= 157,\!286,\!400
\end{aligned}
$$

**Step 4 — batch size 4, lưu ở fp16 (2 byte/phần tử):**

$$
\begin{aligned}
\text{KV cache memory} &= 157,\!286,\!400 \times 4 \times 2 \\
&= 1,\!258,\!291,\!200 \text{ bytes} \\
&\approx 1.17 \text{ GB}
\end{aligned}
$$

Để so sánh, bản thân mô hình có khoảng ~1.5B tham số. Với fp16:

$$
\text{model weights} \approx 1.5 \times 10^9 \times 2 = 3 \text{ GB}
$$

KV cache thêm **khoảng 40%** overhead bộ nhớ ở batch size này.

> Thấy có vẻ nặng đúng không? Trên thực tế, các inference engine trong môi trường production (vllm/sglang) thường tối ưu rất mạnh cho việc quản lý KV cache, nhờ đó có thể giảm đáng kể lượng bộ nhớ sử dụng.

# 5. Kết luận
KV cache là một trong những tối ưu quan trọng nhất trong suy luận LLM.

Nếu không có KV cache, mỗi token được sinh ra sẽ buộc mô hình phải tính lại attention trên toàn bộ ngữ cảnh hết lần này đến lần khác. Điều đó lãng phí một lượng compute rất lớn. KV cache giảm bớt điều này bằng cách lưu các cặp key-value của các token trước đó, cho phép mô hình tái sử dụng thông tin đó cho token mới.

Lý do KV cache hoạt động được là causal masking, nghĩa là các token chỉ có thể attention tới chính nó và các token trước đó, chứ không phải các token tương lai.

Tuy nhiên, KV cache không phải bữa trưa miễn phí. Đây là một đánh đổi kinh điển trong hệ thống: **Tiết kiệm compute thì phải trả bằng memory.**

Sự đánh đổi này là nền tảng cho nhiều kỹ thuật LLM serving, bao gồm continuous batching, paged attention, prefix caching, KV-aware routing và prefill/decode disaggregation.

## References

[1] Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, and Illia Polosukhin. "Attention Is All You Need." Advances in Neural Information Processing Systems 30 (2017). arXiv:1706.03762.

[2] Hugging Face, OpenAI. "GPT-2 Model Card." https://huggingface.co/openai-community/gpt2-xl

[3] Alec Radford, Jeffrey Wu, Rewon Child, David Luan, Dario Amodei, and Ilya Sutskever. "Language Models are Unsupervised Multitask Learners." OpenAI, 2019. https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
