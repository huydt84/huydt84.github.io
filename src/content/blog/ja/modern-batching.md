---
locale: ja
title: "現代システムにおける Batching"
description: 現代システムにおける batching
pubDate: 2026-07-01
tags: [AI, batching, optimization]
draft: false
---

（この記事は OpenAI の GPT-5.4 によって翻訳されています。英語の原文は [こちら](/blog/modern-batching/) をクリックしてください。翻訳に問題があれば、記事の最後から気軽にコメントしてください。）

モデル serving において、batching とは、複数の到着したリクエストをまとめてから model worker に送ることを意味します。

最も単純なサーバーは次のように動きます:
```
request 1 → model worker 
request 2 → model worker 
request 3 → model worker
```

batching を行うサーバーは次のように動きます:
```
request 1 \ 
request 2 → batch → model worker 
request 3 /
```

基本的には、このアイデアは一見とてもシンプルに見えます。多くのリクエストをまとめて、モデルを 1 回実行するだけです。しかし、batching システムを設計する際には、次のような多くの問いに答える必要があります:
- batch はいつ実行すべきか
- どのリクエスト同士をまとめられるか
- リクエストはどこで待つべきか
- batch はどれくらい大きくできるか
- ...

> Batching はサーバー側の scheduling 問題として考えるべきであり、主な検討要素は **timing**、**compatibility rules**、**queueing**、**batch size**、**worker selection** です。

# 1. なぜ Batching が重要なのか
GPU は並列計算が得意です。もし一度に 1 件の小さなリクエストしか送らなければ、GPU に十分な仕事を与えられないかもしれません。

たとえば、ある embedding request が 1 つの短い文しか含まない場合、それを単独で実行すると GPU capacity を無駄にすることがあります。サーバーが多くの小さなリクエストを 1 つの batch にまとめれば、モデルはそれらを一緒に処理でき、throughput は向上します。

これは単純なトレードオフです。サーバーはより多くのリクエストを待つために多少の latency を導入するかもしれませんが、全体の throughput は改善します。**つまり batching が有用なのは、リクエストを長く待たせすぎずに良い batch を組める場合だけです。**

# 2. Batch Timing
最初の問いは次です:
> Batch はいつ実行すべきか?

これは「batching strategy」という言葉で最もよく意味される内容です。

## 2.1. No Batching
No batching では、すべてのリクエストが即座に model worker に送られます。
```
request 1 → model worker 
request 2 → model worker 
request 3 → model worker
```

これはデバッグ、ローカル推論 / 低トラフィック環境、latency-sensitive な経路では有用です。

しかし欠点は GPU utilization が低いことです。各リクエストが小さいと、worker は小さなジョブばかり実行するのに時間を使いすぎるかもしれません。

## 2.2. Client-Side / Static Batching
Client-side batching とは、client がすでに 1 つの request の中に複数の入力を入れて送ってくることです。

```
{ 
    "input": [ 
        "first sentence", 
        "second sentence", 
        "third sentence" 
    ] 
}
```

この場合、サーバーは独立したユーザーリクエスト同士を結合しません。client がすでに batch を作っています。これは *static batching* と呼ばれることが多く、batch がサーバーに届く前にすでに形成されているからです [1](#references)。

これは embedding、reranking、classification など、client 側で簡単に batch を作れるタスクでよく使われます。また、入力を事前に準備できる offline inference においても同様です。

Client-side batching は便利ですが、online serving にはそれだけでは不十分です。online serving では、異なるユーザーからのリクエストが異なる時刻に到着するので、**サーバー自身の batching logic が依然として必要です。**

## 2.3. Server-Side / Dynamic Batching
Dynamic batching とは、サーバーが queue を保持し、実行時に到着する独立したリクエストから batch を組み立てることです。

単純化した dynamic batcher は次のようになります:
```
while True:
    wait for requests to arrive
    put the requests in a queue
    dynamic batcher forms a batch from the queue
    send the batch to the model worker
```

NVIDIA Triton は dynamic batching を、推論リクエストを組み合わせて batch を動的に作るサーバー機能として定義しています [2](#references)。

Dynamic batcher には通常、maximum batch size、maximum queue delay、priority levels、queue policy などの制御があります。これらはこの後の節でさらに説明します。

## 2.4. Continuous / In-Flight Batching
Decoder-only LLM serving は本質的に異なります。chat completion request は 1 回の forward pass では終わりません。モデルは 1 token 生成し、次にまた 1 token、その次も 1 token と生成していきます。すぐに終わるリクエストもあれば、数百あるいは数千 token 生成し続けるものもあります。

もしサーバーが batch 内のすべてのリクエストの終了を待つなら、短いリクエストは早く終わっても、batch 全体は最も長いリクエストにブロックされたままです。**Continuous batching は、active batch が時間とともに変化できるようにすることでこれを解決します。**

例:
```
step 1: A B C 
step 2: A B C 
step 3: A   C D 
step 4:     C D E
...
```

見て分かるように、batch は時間とともに変化します。
- request `A` と `B` は早く終了するので batch から抜けます。
- request `D` は `B` が終わった後に到着し、batch に加わります。
- request `E` はさらに後で到着し、`A` が終わった後に加わります。

サーバーは、すべてのリクエストが終わるのを待ってから次へ進むわけではありません。

このアイデアには複数の呼び名があります。ORCA ではこれを *iteration-level scheduling* と説明しており、スケジューリングは request 全体の単位ではなく generation iteration 単位で行われます [3](#references)。TensorRT-LLM は似た考え方に対して *in-flight batching* または *continuous batching* という用語を使っています [4](#references)。

# 3. Compatibility Rules
2 つ目の問いは次です:
> どのリクエスト同士をまとめられるか?

すべてのリクエストが他のすべてのリクエストと batch できるわけではありません。batching システムには compatibility rules が必要です。

## 3.1. Same Model
最も基本的なルールは、リクエストが同じ model を使う必要があるということです。

```
Llama requests → Llama batch
Qwen requests → Qwen batch 
BERT requests → BERT batch
```

Multi-model server は通常、モデルごとに別々の queue または worker を持ちます。これは、たとえば chat には Qwen、classification には BERT、ASR には Whisper のように、異なる task や architecture を持つモデルを使う場合に特にうまく機能します。

## 3.2 Length Compatibility
text model では、入力長が重要です。

```
request A: 8 tokens 
request B: 12 tokens 
request C: 20 tokens 
request D: 1024 tokens
```

もしモデルがすべてのリクエストを最も長いリクエストに合わせて padding するなら、最初の 3 つのリクエストでは多くの計算が無駄になります。

重要な考え方は次です:
> padding の無駄が大きくなりすぎるなら、極端に短いリクエストと極端に長いリクエストを同じ batch に入れないこと。

よくある解決策は、似た「length groups」（bucket）ごとにまとめることです:
```
bucket 1: 1-16 tokens → batch 1
bucket 2: 17-32 tokens → batch 2
...
bucket 64: 1009-1024 tokens → batch 64
...
```

## 3.3. Runtime Option Compatibility
いくつかの runtime option は、リクエストを効率よくまとめられるかどうかに影響します。
- streaming vs non-streaming
- structured output mode vs text output mode
- sampling mode: greedy vs beam search
- Input/output modality
- ...

ある engine ではこれらを 1 つの batch に混在させられますが、別の engine ではできないかもしれません。サーバーは、どの option の組み合わせが安全に混在できるかを理解して batch を作る必要があります。

## 3.4. Adapter Compatibility
**LoRA** serving は別の compatibility 問題を追加します。*多くのユーザーが同じ base model を共有していても、異なる adapter を使う可能性がある* からです。

単純なサーバーでは、1 つの batch が 1 つの adapter だけを使う必要があるかもしれません:
```
base model A + adapter X → batch 1 
base model A + adapter Y → batch 2
```

より高度なシステムでは、異なる adapter をまとめて batch できます。SGLang のドキュメントでは、1 つの batch の中で異なる sequence に対して複数の LoRA adapter を serving できることが説明されています [5](#references)。

## 3.5. Prefix Affinity
多くの LLM application では、同じ prefix が再利用されます。system prompt、tool description、conversation history、evaluation などです。

多くのリクエストが似た prefix や cache state を共有しているなら、サーバーはそれらを一緒に grouping または routing することで恩恵を受けられるかもしれません。特に **in-batch prefix caching** をサポートしている場合はそうです。

# 4. Queues
3 つ目の問いは次です:
> リクエストは batch になる前にどこで待つべきか?

もちろん答えは **queue** ですが、*queue design は重要です。なぜなら、どの batch が可能になるかを決めるからです。*

## 4.1. One Global Queue
最も単純な設計は、すべてのリクエストに対して 1 つの queue を使うことです。
```
all requests → global queue → batcher
```

これは構築しやすいですが、*head-of-line blocking* を引き起こすことがあります。たとえば、長いリクエストや低 priority のリクエストが、短くて緊急なリクエストの前に居座ってしまうかもしれません。

## 4.2. Per-Model Queue
Multi-model server では、モデルごとに 1 つの queue を使うことがよくあります。これにより、互換性のないモデルを混在させずに済み、model-specific batching もしやすくなります。

これはもちろん、先ほど触れた [Same model](#31-same-model) の compatibility rule にきれいに従っています。

## 4.3. Per-Priority Queue
Production system では、traffic class を分けることがよくあります。
- realtime user request > offline ingestion job
- paid user > free user
- production traffic > experiment traffic

Triton の scheduler documentation には、dynamic batching の priority levels と queue policies が含まれています [2](#references)。

## 4.4. Per-Tenant Queue
共有システムでは、1 つの tenant がサーバー全体を支配できてはいけません。

サーバーは tenant ごとに別々の queue や accounting を持つことがあります。そうすれば scheduler は quota や weighted fairness を適用できます。

# 5. Batch Limits
4 つ目の問いは次です:
> Batch はどれくらい大きくできるのか。そしてサーバーはいつ待つのをやめるべきか?

ここで scheduler が latency と throughput のトレードオフを制御します。

## 5.1. Max Batch Size
最も単純な制限は request count です。batch size はあらかじめ定めた数を超えられません。

しかし、request count だけでは不十分です。32 件の短いリクエストの batch と、32 件の長いリクエストの batch はまったく異なります。

## 5.2. Wait Limit
[Dynamic batching](#23-server-side--dynamic-batching) は通常、より多くのリクエストを集めるために短時間待ちます。

これは *latency-throughput knob* です。待ち時間が短すぎると、サーバーは小さな batch ばかり作って GPU capacity を無駄にするかもしれません。待ち時間が長すぎると、ユーザーは余分な latency を感じます。

したがって実践的なルールは、この値を状況に応じて柔軟にすることです。offline job なら、より大きな batch を作るために長く待てます。interactive request なら、より小さな batch でもすぐ実行する必要があるかもしれません。

## 5.3. Token and Memory Budget
text model では、request count は粗すぎることがよくあります。10 token の request が 32 件ある batch と、4096 token の request が 32 件ある batch はまったく異なります。そこで、より良い batching system では `sum(input_tokens) <= token_budget` のような token budget を使うことがよくあります。

Decoder LLM では、サーバーは output token と KV cache memory も考える必要があります。なぜなら KV cache memory は output token 数に直接比例するからです。

vLLM は、1 iteration で処理される token 数の上限である `max_num_batched_tokens` と、1 iteration で処理される sequence 数の上限である `max_num_seqs` を公開しています [6](#references)。

`max_num_seqs` または `max_num_batched_tokens` を減らすと、batch 内の同時リクエスト数が減り、当然ながら必要な KV cache space も少なくなります。

# 6. Practical Checklist
batching system を設計する際には、次の問いに明確に答えられるべきです。
## 6.1. 本当に batching が必要か?
Batching は無料ではありません。リクエストをまとめることで throughput は改善しますが、queueing delay と実装の複雑さも増えます。

次のような場合、batching は見合わないかもしれません:
- Traffic が非常に少ない
- Throughput より latency の方が重要
- モデルがすでに単一リクエストで飽和している
- リクエストが異質すぎてうまく group できない
- CPU preprocessing、network、storage、database call が本当の bottleneck である
## 6.2. ワークロードは one-shot か iterative か?
- モデルが request ごとに 1 回だけ動くなら、通常は dynamic batching で十分です。例: embedding、reranking、classification、image feature extraction...
- モデルが token ごとに生成するなら、通常は continuous batching が必要です。代表例は decoder LLM generation です。

## 6.3. 誰が batch を作るのか?
- client がすでに多くの入力を持っているなら、client-side / static batching を使う。
- 独立した online request が時間とともに到着するなら、サーバーには dynamic batching が必要。

## 6.4. どのリクエストなら安全かつ有用にまとめられるか?
Compatibility check:
- Same model or endpoint
- Similar input length / request cost
- Compatible runtime options
- Compatible adapter state
- Useful prefix/cache affinity

しかし、完全な互換性を得るために長く待ちすぎると、latency が増えることがあります。より良い組み合わせを探すために batcher が実行を遅らせ続けると、リクエストが queue の中で長く待ちすぎるかもしれません。

効率よく一緒に実行できるリクエストを group するべきですが、latency が悪化するほど実行を遅らせてはいけません。

## 6.5. リクエストはどこで待つべきか?
queue は、batcher から見えるリクエスト集合を定義します。

最初は 1 つの global queue から始めましょう。ほとんどの場合、それで十分うまくいきます。

本当に理由がある場合にだけ分割すればよいです:
- *Per-model queue*: 異なる model の混在を避ける
- *Priority queue*: offline job から realtime traffic を守る
- *Tenant queue*: 1 つの tenant がサーバーを支配するのを防ぐ

**すべての grouping rule を新しい queue にしてはいけません**。たとえば、似た長さで grouping するのは 1 つの grouping rule です。これは長さごとの queue を分けて実装することもできますが、1 つの queue と length-aware selection で実装することもできます。

## 6.6. 本当の batch limit は何か?
request count だけでは不十分です。batch limit は次のようなものになりえます:
- Maximum wait time
- Maximum context memory (sequence, token, KV cache)
- Latency target / SLO
- Tenant/class quota

単純な encoder model なら、max batch size と max wait time で十分かもしれません。LLM serving では、token と memory の制限の方が重要です。

## 6.7. 何が問題になりうるか?
どの batching design にも failure mode があります。
- `client-side / static batching`: offline job には良いが、独立した online traffic には不十分
- `dynamic batching`: queueing latency を増やすことがある
- `continuous batching`: memory、cancellation、fairness の扱いがより複雑
- `length-aware grouping`: まれな長さグループは長く待つかもしれない
- `priority rules`: 低 priority traffic が starvation するかもしれない
- `tenant queues`: 分離が強すぎると batch fill rate が下がる
- `adapter-aware grouping`: adapter が細かく分かれすぎると batch fill rate が下がるかもしれない
- `prefix-aware grouping`: batch size を小さくする代わりに cache locality を改善するかもしれない


# 7. 結論

現代の batching は、単に「より多くのリクエストを 1 つの batch に入れること」ではありません。到着したリクエストを実行可能な work にまとめるための policy です。

> 目標は、やみくもに batch size を最大化することではありません。目標は **throughput、latency、memory、fairness、implementation complexity** の最良のトレードオフを見つけることです。


# References
[1] Salesforce Engineering. “Benchmarking Triton (TensorRT) Inference Server for Hosting Transformer Language Models.” https://www.salesforce.com/blog/benchmarking-tensorrt-inference-server/

[2] NVIDIA Triton Inference Server Documentation. “Batchers.” https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html#dynamic-batcher

[3] Gyeong-In Yu, Joo Seong Jeong, Geon-Woo Kim, Soojeong Kim, and Byung-Gon Chun. “Orca: A Distributed Serving System for Transformer-Based Generative Models.” [OSDI 2022.](https://www.usenix.org/conference/osdi22/presentation/yu)

[4] NVIDIA TensorRT-LLM Documentation. "Paged Attention, IFB, and Request Scheduling." https://nvidia.github.io/TensorRT-LLM/features/paged-attention-ifb-scheduler.html#in-flight-batching

[5] SGLang Documentation. “LoRA Serving.” https://sgl-project-sglang-93.mintlify.app/advanced/lora

[6] vLLM Documentation. “SchedulerConfig.”
https://docs.vllm.ai/en/latest/api/vllm/config/scheduler/
