---
locale: vi
title: "Batching trong các hệ thống hiện đại"
description: Batching trong các hệ thống hiện đại
pubDate: 2026-07-01
tags: [AI, batching, optimization]
draft: false
---

_(Bài viết này được dịch bởi GPT-5.4 của OpenAI. Để xem nội dung gốc bằng tiếng Anh, hãy nhấp [vào đây](/blog/modern-batching/). Nếu gặp vấn đề với bản dịch, vui lòng để lại bình luận ở cuối bài viết.)_

Trong model serving, batching có nghĩa là gom nhiều request đến lại với nhau trước khi gửi chúng tới model worker.

Server đơn giản nhất làm như sau:
```
request 1 → model worker 
request 2 → model worker 
request 3 → model worker
```

Một batching server làm như sau:
```
request 1 \ 
request 2 → batch → model worker 
request 3 /
```

Về cơ bản, ý tưởng này thoạt nhìn có vẻ rất đơn giản: gom nhiều request lại, rồi chạy model một lần. Tuy nhiên, khi thiết kế một hệ thống batching, có rất nhiều câu hỏi cần trả lời, chẳng hạn như:
- Khi nào batch nên được chạy?
- Những request nào có thể được gom lại với nhau?
- Request nên chờ ở đâu?
- Batch có thể lớn tới mức nào?
- ...

> Batching nên được xem như một bài toán scheduling ở phía server, với **timing**, **compatibility rules**, **queueing**, **batch size** và **worker selection** là những yếu tố chính cần cân nhắc.

# 1. Vì sao Batching quan trọng
GPU rất giỏi tính toán song song. Nếu ta chỉ gửi từng request nhỏ một, GPU có thể không có đủ việc để làm.

Ví dụ, một embedding request có thể chỉ chứa một câu ngắn. Chạy riêng nó có thể làm lãng phí năng lực của GPU. Nếu server gom nhiều request nhỏ vào một batch, model có thể xử lý chúng cùng nhau và throughput sẽ tăng lên.

Đây là một sự đánh đổi đơn giản: server có thể thêm một chút latency để chờ thêm request đến, nhưng throughput tổng thể sẽ được cải thiện. **Vì vậy batching chỉ hữu ích khi server có thể tạo được một batch tốt mà không làm request phải chờ quá lâu.**

# 2. Batch Timing
Câu hỏi đầu tiên là:
> Khi nào batch nên được chạy?

Đây là ý nghĩa phổ biến nhất của cụm từ “batching strategy”.

## 2.1. No Batching
No batching nghĩa là mỗi request được gửi ngay tới model worker.
```
request 1 → model worker 
request 2 → model worker 
request 3 → model worker
```

Điều này hữu ích cho việc debug, suy luận cục bộ / kịch bản lưu lượng thấp, và các đường đi nhạy cảm với latency.

Tuy nhiên, nhược điểm là GPU utilization kém. Nếu mỗi request đều nhỏ, worker có thể dành quá nhiều thời gian để chạy những job tí hon.

## 2.2. Client-Side / Static Batching
Client-side batching nghĩa là client đã gửi nhiều input trong cùng một request.

```
{ 
    "input": [ 
        "first sentence", 
        "second sentence", 
        "third sentence" 
    ] 
}
```

Trong trường hợp này, server không kết hợp các request độc lập từ người dùng. Client đã tự tạo batch rồi. Điều này thường được gọi là *static batching* vì batch đã được hình thành trước khi tới server [1](#references).

Đây là cách tiếp cận phổ biến cho embedding, reranking, classification và các tác vụ khác mà client có thể dễ dàng tạo batch. Nó cũng phù hợp với offline inference, nơi client có thể chuẩn bị sẵn một batch input từ trước.

Client-side batching hữu ích, nhưng nó không đủ cho online serving. Trong online serving, request đến từ nhiều người dùng khác nhau tại những thời điểm khác nhau, nên **server vẫn cần logic batching của riêng mình.**

## 2.3. Server-Side / Dynamic Batching
Dynamic batching nghĩa là server giữ một queue và tạo batch từ các request độc lập đến vào lúc runtime.

Một dynamic batcher được đơn giản hóa có thể trông như sau:
```
while True:
    wait for requests to arrive
    put the requests in a queue
    dynamic batcher forms a batch from the queue
    send the batch to the model worker
```

NVIDIA Triton định nghĩa dynamic batching là một tính năng của server dùng để kết hợp các inference request sao cho một batch được tạo ra một cách động [2](#references).

Một dynamic batcher thường có các điều khiển như: maximum batch size, maximum queue delay, priority levels, queue policy... Chúng sẽ được bàn sâu hơn ở phần sau của bài viết này.

## 2.4. Continuous / In-Flight Batching
Decoder-only LLM serving có bản chất khác hẳn. Một chat completion request không kết thúc sau một forward pass. Model sinh ra một token, rồi một token nữa, rồi lại một token nữa. Có request kết thúc nhanh. Có request tiếp tục sinh hàng trăm hoặc hàng nghìn token.

Nếu server chờ mọi request trong một batch kết thúc, các request ngắn sẽ xong sớm nhưng cả batch vẫn bị chặn bởi request dài nhất. **Continuous batching giải quyết điều này bằng cách cho phép active batch thay đổi theo thời gian.**

Ví dụ:
```
step 1: A B C 
step 2: A B C 
step 3: A   C D 
step 4:     C D E
...
```

Như bạn có thể thấy, batch thay đổi theo thời gian.
- Request `A` và `B` kết thúc sớm nên rời khỏi batch.
- Request `D` đến và tham gia batch sau khi request `B` kết thúc.
- Request `E` đến muộn hơn và tham gia batch sau khi request `A` kết thúc.

Server không chờ tất cả request hoàn tất rồi mới tiếp tục.

Ý tưởng này có nhiều tên gọi. ORCA mô tả nó là *iteration-level scheduling*, nơi việc scheduling diễn ra ở cấp độ từng vòng lặp sinh token thay vì ở cấp độ toàn bộ request [3](#references). TensorRT-LLM dùng thuật ngữ *in-flight batching* hoặc *continuous batching* cho một ý tưởng tương tự [4](#references).

# 3. Compatibility Rules
Câu hỏi thứ hai là:
> Những request nào có thể được gom lại với nhau?

Không phải request nào cũng có thể batch chung với mọi request khác. Hệ thống batching cần các compatibility rules.

## 3.1. Same Model
Quy tắc cơ bản nhất là các request phải dùng cùng một model.

```
Llama requests → Llama batch
Qwen requests → Qwen batch 
BERT requests → BERT batch
```

Một multi-model server thường giữ các queue hoặc worker riêng cho từng model. Điều này đặc biệt phù hợp nếu server dùng các model khác nhau cho các tác vụ và kiến trúc khác nhau, ví dụ Qwen cho chat, BERT cho classification, Whisper cho ASR.

## 3.2 Length Compatibility
Với text model, độ dài input rất quan trọng.

```
request A: 8 tokens 
request B: 12 tokens 
request C: 20 tokens 
request D: 1024 tokens
```

Nếu model pad mọi request theo request dài nhất, ba request đầu sẽ lãng phí rất nhiều tính toán.

Ý tưởng quan trọng là:
> Đừng gom các request rất ngắn và rất dài với nhau nếu phần lãng phí do padding trở nên quá lớn.

Một cách giải quyết phổ biến là gom các request có "length groups" (bucket) tương tự nhau:
```
bucket 1: 1-16 tokens → batch 1
bucket 2: 17-32 tokens → batch 2
...
bucket 64: 1009-1024 tokens → batch 64
...
```

## 3.3. Runtime Option Compatibility
Một số runtime option có thể ảnh hưởng tới việc liệu các request có thể được gom lại hiệu quả hay không.
- streaming vs non-streaming
- structured output mode vs text output mode
- sampling mode: greedy vs beam search
- Input/output modality
- ...

Một số engine có thể trộn các option này trong cùng một batch, một số khác thì không. Server cần biết những option nào có thể trộn an toàn để tạo batch.

## 3.4. Adapter Compatibility
**LoRA** serving thêm một bài toán compatibility khác: *Nhiều người dùng có thể dùng chung một base model nhưng lại dùng các adapter khác nhau.*

Một server đơn giản có thể yêu cầu mỗi batch chỉ dùng một adapter:
```
base model A + adapter X → batch 1 
base model A + adapter Y → batch 2
```

Các hệ thống cao cấp hơn có thể batch nhiều adapter khác nhau cùng lúc. Tài liệu của SGLang mô tả khả năng phục vụ nhiều LoRA adapter cho các sequence khác nhau trong cùng một batch [5](#references).

## 3.5. Prefix Affinity
Nhiều ứng dụng LLM tái sử dụng cùng một prefix: system prompt, tool description, conversation history, evaluation,...

Nếu nhiều request chia sẻ prefix hoặc cache state tương tự nhau, server có thể hưởng lợi khi grouping hoặc routing chúng cùng nhau; đặc biệt khi có hỗ trợ **in-batch prefix caching**.

# 4. Queues
Câu hỏi thứ ba là:
> Request nên chờ ở đâu trước khi trở thành một batch?

Dĩ nhiên câu trả lời là **queue**, nhưng *thiết kế queue rất quan trọng vì nó quyết định những batch nào là khả thi.*

## 4.1. One Global Queue
Thiết kế đơn giản nhất là một queue cho tất cả request.
```
all requests → global queue → batcher
```

Điều này dễ xây dựng, nhưng có thể gây ra *head-of-line blocking*. Ví dụ, một request dài hoặc request ưu tiên thấp có thể nằm phía trước các request ngắn và khẩn cấp.

## 4.2. Per-Model Queue
Một multi-model server thường dùng một queue cho mỗi model. Điều này tránh trộn các model không tương thích và giúp batching theo từng model dễ hơn.

Điều này dĩ nhiên cũng khớp hoàn toàn với quy tắc compatibility [Same model](#31-same-model) đã nói ở trên.

## 4.3. Per-Priority Queue
Các hệ thống production thường tách các lớp lưu lượng.
- realtime user request > offline ingestion job
- paid user > free user
- production traffic > experiment traffic

Tài liệu scheduler của Triton có đề cập priority levels và queue policies cho dynamic batching [2](#references).

## 4.4. Per-Tenant Queue
Trong một hệ thống dùng chung, một tenant không nên có khả năng chiếm lĩnh toàn bộ server.

Server có thể giữ queue hoặc accounting riêng cho từng tenant. Khi đó scheduler có thể áp dụng quota hoặc weighted fairness.

# 5. Batch Limits
Câu hỏi thứ tư là:
> Batch có thể lớn tới mức nào, và khi nào server nên ngừng chờ?

Đây là nơi scheduler điều khiển sự đánh đổi giữa latency và throughput.

## 5.1. Max Batch Size
Giới hạn đơn giản nhất là số lượng request. Batch size không thể vượt quá một con số đã được định nghĩa sẵn.

Nhưng chỉ đếm số request là chưa đủ. Một batch gồm 32 request ngắn rất khác với một batch gồm 32 request dài.

## 5.2. Wait Limit
[Dynamic batching](#23-server-side--dynamic-batching) thường chờ một khoảng ngắn để gom thêm request.

Đây là *latency-throughput knob*. Nếu thời gian chờ quá ngắn, server có thể tạo ra các batch rất nhỏ và lãng phí năng lực GPU. Nếu thời gian chờ quá dài, người dùng sẽ cảm nhận thêm latency.

Vì vậy, quy tắc thực tế là làm cho con số này linh hoạt theo tình huống: với các job offline, server có thể chờ lâu hơn để tạo batch lớn hơn. Với các request tương tác, server có thể cần chạy ngay một batch nhỏ hơn.

## 5.3. Token and Memory Budget
Với text model, số lượng request thường là một thước đo quá thô. Một batch gồm 32 request, mỗi request 10 token, rất khác với một batch gồm 32 request, mỗi request 4096 token. Vì vậy, một hệ thống batching tốt hơn thường dùng token budget: `sum(input_tokens) <= token_budget`

Với decoder LLM, server cũng cần nghĩ tới output token và KV cache memory, vì KV cache memory tỉ lệ trực tiếp với số lượng output token.

vLLM cung cấp `max_num_batched_tokens`, tức số token tối đa được xử lý trong một iteration, và `max_num_seqs`, tức số sequence tối đa được xử lý trong một iteration [6](#references).

Giảm `max_num_seqs` hoặc `max_num_batched_tokens` sẽ làm giảm số request đồng thời trong một batch và rõ ràng cũng cần ít KV cache space hơn.

# 6. Practical Checklist
Khi thiết kế một hệ thống batching, các câu hỏi sau cần được trả lời rõ ràng.
## 6.1. Chúng ta có thực sự cần batching không?
Batching không miễn phí. Nó cải thiện throughput bằng cách gom request lại, nhưng cũng có thể thêm queueing delay và độ phức tạp trong triển khai.

Batching có thể không đáng khi:
- Traffic rất thấp
- Latency quan trọng hơn throughput
- Model đã bão hòa chỉ với từng request đơn lẻ
- Request quá dị biệt để gom nhóm tốt
- CPU preprocessing, network, storage hoặc database calls mới là bottleneck thực sự
## 6.2. Workload là one-shot hay iterative?
- Nếu model chạy một lần cho mỗi request: dynamic batching thường là đủ. Ví dụ: embedding, reranking, classification, image feature extraction,...
- Nếu model sinh từng token một: continuous batching thường là cần thiết. Ví dụ phổ biến là decoder LLM generation.

## 6.3. Ai là người tạo batch?
- Nếu client đã có nhiều input, hãy dùng client-side / static batching.
- Nếu các online request độc lập đến theo thời gian, server cần dynamic batching.

## 6.4. Những request nào là an toàn và hữu ích để gom lại?
Compatibility check:
- Same model or endpoint
- Similar input length / request cost
- Compatible runtime options
- Compatible adapter state
- Useful prefix/cache affinity

Tuy nhiên, chờ quá lâu để đạt compatibility hoàn hảo có thể làm tăng latency. Nếu batcher cứ tiếp tục trì hoãn việc thực thi để tìm những cặp khớp tốt hơn, request có thể phải ở trong queue quá lâu.

Hãy gom những request có thể chạy hiệu quả cùng nhau, nhưng đừng trì hoãn thực thi đến mức làm latency xấu đi.

## 6.5. Request nên chờ ở đâu?
Queue xác định những request nào là hữu hình đối với batcher.

Hãy bắt đầu đơn giản với 1 global queue. Trong đa số trường hợp, như vậy là hoàn toàn ổn.

Chỉ tách queue khi có lý do thực sự:
- *Per-model queue*: tránh trộn các model khác nhau
- *Priority queue*: bảo vệ realtime traffic khỏi offline jobs
- *Tenant queue*: ngăn một tenant thống trị toàn bộ server

**Đừng biến mọi grouping rule thành một queue mới**. Ví dụ, độ dài tương tự là một grouping rule. Nó có thể được triển khai bằng các queue riêng theo độ dài, nhưng cũng có thể được triển khai bằng một queue duy nhất và cơ chế chọn lựa có nhận thức về độ dài.

## 6.6. Giới hạn batch thực sự là gì?
Chỉ đếm request là chưa đủ. Một batch limit có thể là:
- Maximum wait time
- Maximum context memory (sequence, token, KV cache)
- Latency target / SLO
- Tenant/class quota

Với các encoder model đơn giản, max batch size và max wait time có thể là đủ. Với LLM serving, token và memory limit quan trọng hơn.

## 6.7. Điều gì có thể đi sai?
Mỗi thiết kế batching đều có một failure mode.
- `client-side / static batching`: tốt cho offline jobs, nhưng không đủ cho online traffic độc lập
- `dynamic batching`: có thể thêm queueing latency
- `continuous batching`: xử lý memory, cancellation và fairness phức tạp hơn
- `length-aware grouping`: các nhóm độ dài hiếm có thể phải chờ lâu hơn
- `priority rules`: traffic ưu tiên thấp có thể bị starvation
- `tenant queues`: cô lập quá mức có thể làm giảm batch fill rate
- `adapter-aware grouping`: có thể làm giảm batch fill rate nếu adapter bị phân mảnh quá nhiều
- `prefix-aware grouping`: có thể làm giảm batch size trong khi lại cải thiện cache locality


# 7. Kết luận

Batching hiện đại không chỉ là “đưa nhiều request hơn vào một batch”. Nó là chính sách để gom các request đến thành công việc có thể thực thi được.

> Mục tiêu không nên là mù quáng tối đa hóa batch size. Mục tiêu là tìm ra sự đánh đổi tốt nhất giữa **throughput, latency, memory, fairness, implementation complexity**


# References
[1] Salesforce Engineering. “Benchmarking Triton (TensorRT) Inference Server for Hosting Transformer Language Models.” https://www.salesforce.com/blog/benchmarking-tensorrt-inference-server/

[2] NVIDIA Triton Inference Server Documentation. “Batchers.” https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html#dynamic-batcher

[3] Gyeong-In Yu, Joo Seong Jeong, Geon-Woo Kim, Soojeong Kim, and Byung-Gon Chun. “Orca: A Distributed Serving System for Transformer-Based Generative Models.” [OSDI 2022.](https://www.usenix.org/conference/osdi22/presentation/yu)

[4] NVIDIA TensorRT-LLM Documentation. "Paged Attention, IFB, and Request Scheduling." https://nvidia.github.io/TensorRT-LLM/features/paged-attention-ifb-scheduler.html#in-flight-batching

[5] SGLang Documentation. “LoRA Serving.” https://sgl-project-sglang-93.mintlify.app/advanced/lora

[6] vLLM Documentation. “SchedulerConfig.”
https://docs.vllm.ai/en/latest/api/vllm/config/scheduler/
