---
locale: vi
title: "PagedAttention, ý tưởng đằng sau vLLM"
description: Về PagedAttention, thuật toán đứng sau vLLM
pubDate: 2026-07-01
tags: [attention, AI, kv-cache, optimization]
draft: false
---

_(Bài viết này được dịch bởi GPT-5.4 của OpenAI. Để xem nội dung gốc bằng tiếng Anh, hãy nhấp [vào đây](/blog/paged-attention/). Nếu gặp vấn đề với bản dịch, vui lòng để lại bình luận ở cuối bài viết.)_

PagedAttention [1](#reference) là một trong những ý tưởng cốt lõi đứng sau các hệ thống LLM serving có throughput cao như vLLM. Nó không thay đổi kiến trúc Transformer. Nó cũng không loại bỏ nhu cầu phải tính attention. Thay vào đó, nó thay đổi cách KV cache được lưu trữ và quản lý trong quá trình suy luận.

# 1. Kiến thức nền
Để hiểu đầy đủ PagedAttention, chúng ta cần quen với các khái niệm sau:
- Transformer Architecture
- Basic Linear Algebra
- KV Caching. Bạn có thể xem [bài blog của tôi](/blog/kv-cache-basic-explanation/) để có giải thích chi tiết.

# 2. PagedAttention là gì?
## 2.1. Bản chất của LLM Serving
Trong serving, nhiều người dùng gửi request cùng lúc. Mỗi request có thể có độ dài prompt khác nhau, độ dài đầu ra khác nhau, điều kiện dừng khác nhau và sampling strategy khác nhau. Có request kết thúc rất nhanh. Có request tiếp tục sinh trong thời gian dài. Cũng có request vẫn còn đang chờ tới lượt được xử lý.

Vì vậy, server cần quản lý đồng thời nhiều KV cache đang tăng và giảm kích thước liên tục. Đây là lúc memory fragmentation trở thành một vấn đề nghiêm trọng.

Hãy tưởng tượng một tình huống mà bạn phục vụ 1000 request đồng thời. Như [bài blog trước](/blog/kv-cache-basic-explanation/) đã giải thích, bộ nhớ được cấp phát cho KV cache phụ thuộc vào độ dài của phản hồi được sinh ra, mà bạn không thể biết trước. Để giảm rủi ro đó, bạn cấp phát sẵn không gian cho độ dài tối đa, nhưng phản hồi thực tế lại ngắn hơn rất nhiều.

Điều đó có nghĩa là với mỗi request, bạn có thể chỉ dùng một phần nhỏ trong lượng bộ nhớ đã cấp phát cho request đó. Điều này dẫn tới một số vấn đề:
- Mỗi request nhận một vùng bộ nhớ tách biệt riêng, không thể chia sẻ với request khác ngay cả khi 1000 request cùng dùng chung một system prompt, nên sẽ có các KV cache entry bị trùng lặp.
- Server có thể có rất nhiều bộ nhớ trống về mặt lý thuyết, nhưng không dùng được vì nó bị phân tán thành nhiều khối liên tiếp nhỏ bị phân mảnh.

## 2.2. Ý tưởng của PagedAttention
Ý tưởng cốt lõi của **PagedAttention** thực ra rất đơn giản:
> Nó chia KV cache thành các block có kích thước cố định, và dùng một block table để ánh xạ vị trí token logic sang các block bộ nhớ vật lý.

Ý tưởng này rất giống với virtual memory trong hệ điều hành, nơi OS chia bộ nhớ thành các page có kích thước cố định và dùng page table để ánh xạ địa chỉ logic sang vị trí vật lý.

## 2.3. Minh họa đơn giản
Các logical block của Sequence A:
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

Từ góc nhìn của mô hình, Sequence A vẫn có một ngữ cảnh logic liên tục. Nhưng về mặt vật lý, KV cache có thể nằm rải rác trong bộ nhớ. attention kernel dùng block table để tìm đúng các physical block trong lúc tính attention.

# 3. Vì sao PagedAttention giúp ích cho suy luận?
PagedAttention giúp ích cho suy luận chủ yếu bằng cách cải thiện hiệu quả sử dụng bộ nhớ của KV cache. Bạn vẫn phải tính công thức attention, nó không rẻ hơn.

Lợi ích thực sự là PagedAttention cho phép server chứa được nhiều active sequence hơn trong GPU memory. Nhiều active sequence hơn có nghĩa là các continuous batch lớn hơn. Các continuous batch lớn hơn có nghĩa là GPU utilization tốt hơn và throughput cao hơn.

## 3.1. Vấn đề cũ: cấp phát KV liên tục

Hãy tưởng tượng một server đơn giản cấp phát một vùng KV cache liên tục cho mỗi request, và nó phục vụ 1000 request đồng thời.

Như [bài blog trước](/blog/kv-cache-basic-explanation/) đã giải thích, bộ nhớ được cấp phát cho KV cache phụ thuộc vào độ dài của phản hồi được sinh ra, mà bạn không thể biết trước. Mô hình có thể sinh 32 token, 512 token hoặc 4096 token. Nếu server giữ chỗ quá ít bộ nhớ, nó có thể phải cấp phát lại. Nếu giữ chỗ quá nhiều, bộ nhớ sẽ bị lãng phí.

Một server ngây thơ có thể cấp phát bộ nhớ như sau:
```
request 1: reserve max 4096 tokens
request 2: reserve max 4096 tokens
request 3: reserve max 4096 tokens
...
```

Điều đó tạo ra **internal fragmentation** (hoặc **over-reservation**) trong suốt thời gian request còn chạy. Sự lãng phí này tồn tại bên trong một vùng cấp phát vẫn còn sống, nghĩa là request vẫn đang chạy nhưng phần lớn KV cache đã giữ chỗ lại chưa được sử dụng:
```
reserved memory: 4096 tokens
actually used: 300 tokens
wasted: 3796 tokens
```

Cũng có một vấn đề khác riêng biệt là **external fragmentation**. Giả sử bộ nhớ KV trên GPU được chia như sau, với 4 request đang sử dụng:

```
Memory: [ A ][ B ][ C ][ D ] 
```

Sau đó request `B` kết thúc, và request `D` cũng kết thúc:

```
Memory: [ A ][   ][ C ][   ] 
```

Tổng bộ nhớ trống là hai chunk, nhưng vùng trống liên tục lớn nhất chỉ là một chunk. Một request mới cần hai chunk liên tục sẽ không thể vừa, dù tổng bộ nhớ trống về mặt kỹ thuật là đủ.

Vì vậy, nếu KV cache của mỗi request bắt buộc phải liên tục, external fragmentation có thể khiến lượng bộ nhớ thực sự dùng được nhỏ hơn tổng bộ nhớ còn trống.

**PagedAttention giảm cả hai vấn đề này. Nó tránh việc phải giữ chỗ một vùng KV cực lớn theo độ dài tối đa cho mỗi request, và cũng tránh yêu cầu KV cache logic của một sequence phải nằm trong một vùng bộ nhớ vật lý liên tục duy nhất.**

> Nghe quen không? Đây là một bài toán kinh điển trong quản lý bộ nhớ, và đó cũng là lý do các kỹ thuật như paging và segmentation được dùng trong hệ điều hành.

## 3.2. PagedAttention làm giảm fragmentation
**PagedAttention** loại bỏ nhu cầu phải giữ chỗ một vùng liên tục khổng lồ. Thay vào đó, nó cấp phát các KV block nhỏ có kích thước cố định khi cần (mặc định của **vllm** là 16).

Ví dụ: một request có 50 token cần 4 block, trong đó 3 block đầu chứa đủ 16 token, và block cuối chỉ chứa 2 token. **Vì vậy phần lãng phí bộ nhớ chỉ xảy ra ở block cuối cùng của mỗi sequence.**

Với kích thước block là `B`, một sequence chỉ lãng phí tối đa lượng KV cache tương ứng với `B - 1` token. Điều này tốt hơn rất nhiều so với việc giữ chỗ bộ nhớ cho `max_seq_len` cho mọi request.

*Nhiều KV memory khả dụng hơn có nghĩa là nhiều active sequence vừa hơn, server nhận thêm được nhiều request hơn, và throughput được cải thiện.*

## 3.3. PagedAttention cũng cache KV giữa các request
Trong các downstream application của LLM, có thể có nhiều request dùng cùng một system prompt, vì vậy các KV cache entry sẽ bị trùng lặp.

Một hệ thống ngây thơ có thể sao chép prompt KV cache cho từng sample. PagedAttention có thể chia sẻ các physical KV block giữa các sequence. Nhiều sequence logic có thể cùng trỏ tới một physical block. Khi một sequence cần sửa đổi hoặc mở rộng cache, hệ thống có thể dùng reference counting và copy-on-write.

[Blog của vLLM](https://vllm.ai/blog/2023-06-20-vllm) mô tả cơ chế chia sẻ block này và lưu ý rằng nó giúp giảm overhead bộ nhớ cho parallel sampling, beam search và prefix reuse.

Về mặt ý tưởng, điều này tương tự như cách hệ điều hành chia sẻ các memory page giữa các process.

# 4. Các đánh đổi
PagedAttention rất mạnh, nhưng không miễn phí.
## 4.1. Attention kernel phức tạp hơn
Một attention kernel bình thường có thể giả định rằng KV memory là liên tục.

PagedAttention cần tra cứu block table và truy cập bộ nhớ không liên tục. Điều đó khiến kernel phức tạp hơn.

Bài báo vAttention [2](#reference) chỉ ra rõ rằng PagedAttention thay đổi bố cục virtual memory của KV cache từ liên tục sang không liên tục, điều này có thể tạo ra overhead về mặt lập trình và hiệu năng.

## 4.2. Khả năng có gather overhead
Vì các KV block không liên tục về mặt vật lý, kernel có thể cần gather dữ liệu từ nhiều vị trí bộ nhớ khác nhau. Nếu triển khai không tốt, điều này có thể làm hại memory coalescing. Một PagedAttention hiệu năng cao đòi hỏi *thiết kế layout thật cẩn thận và phụ thuộc mạnh vào kiến trúc phần cứng.*

PagedAttention không phải thứ bạn có được chỉ bằng cách lưu các KV tensor trong một Python list. allocator và kernel phải được đồng thiết kế.

## 4.3. Tinh chỉnh block size
Nếu block size quá nhỏ:
- Nhiều block table entry hơn
- Nhiều metadata overhead hơn
- Nhiều lookup overhead hơn

Nếu block size quá lớn:
- Lãng phí nhiều hơn ở block cuối
- Phân bổ bộ nhớ kém linh hoạt hơn

Vì vậy block size là một đánh đổi giữa hiệu quả bộ nhớ và overhead của kernel/runtime.

# 5. Kết luận
PagedAttention được hiểu rõ nhất như virtual memory dành cho KV cache.

LLM serving truyền thống gặp khó vì mỗi request có một KV cache lớn, động và khó cấp phát hiệu quả. Nếu server giữ chỗ quá nhiều KV memory hoặc yêu cầu cấp phát liên tục, memory fragmentation sẽ giới hạn số lượng active request. Điều đó trực tiếp giới hạn batching và throughput.

PagedAttention giải quyết điều này bằng cách chia KV cache thành các block có kích thước cố định. Mỗi sequence có một logical block table, còn các physical block có thể nằm ở bất cứ đâu trong GPU memory. Các block mới chỉ được cấp phát khi cần. Phần lãng phí bộ nhớ chủ yếu chỉ giới hạn ở block cuối của mỗi sequence.

Kết quả không phải là phép toán attention biến mất. Kết quả là inference server có thể giữ nhiều sequence sống hơn, batch nhiều decode step lại với nhau hơn, và sử dụng GPU hiệu quả hơn.

Đó là lý do PagedAttention quan trọng: nó biến KV cache từ một bài toán cấp phát liên tục mong manh thành một bài toán quản lý block linh hoạt. Với LLM serving trong production, khác biệt đó thường chính là khác biệt giữa một server chậm, bị memory-bound và một inference engine throughput cao.

## Reference
[1] Kwon, W., Li, Z., Zhuang, S., Sheng, Y., Zheng, L., Ying, C., ... & Shen, H. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention. In Proceedings of the 29th Symposium on Operating Systems Principles (SOSP).

[2] Prabhu, R., Nayak, A., Mohan, J., Ramjee, R., & Panwar, A. (2024). vAttention: Dynamic Memory Management for Serving LLMs without PagedAttention. arXiv preprint arXiv:2405.04437.
