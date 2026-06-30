---
locale: ja
title: "PagedAttention: vLLM を支えるアイデア"
description: vLLM の背後にあるアルゴリズム、PagedAttention について
pubDate: 2026-07-01
tags: [attention, AI, kv-cache, optimization]
draft: false
---

（この記事は OpenAI の GPT-5.4 によって翻訳されています。英語の原文は [こちら](/blog/paged-attention/) をクリックしてください。翻訳に問題があれば、記事の最後から気軽にコメントしてください。）

PagedAttention [1](#reference) は、vLLM のような高スループット LLM serving システムを支える中核的なアイデアの 1 つです。これは Transformer アーキテクチャ自体を変更するものではありません。attention の計算を不要にするものでもありません。その代わり、推論時に KV cache をどのように保存し、管理するかを変えます。

# 1. 前提知識
PagedAttention を十分に理解するには、次の概念に慣れている必要があります。
- Transformer Architecture
- Basic Linear Algebra
- KV Caching。詳しくは [私のブログ記事](/blog/kv-cache-basic-explanation/) を参照してください。

# 2. PagedAttention とは何か
## 2.1. LLM Serving の性質
serving では、多くのユーザーが同時にリクエストを送ってきます。各リクエストは、prompt の長さ、出力長、停止条件、sampling strategy がそれぞれ異なる可能性があります。すぐに終わるリクエストもあれば、長時間生成し続けるものもあります。まだ処理待ちのものもあります。

そのため、サーバーは増えたり減ったりする多数の KV cache を同時に管理する必要があります。ここで memory fragmentation が深刻な問題になります。

1000 件の同時リクエストを処理する状況を想像してみてください。[前回のブログ記事](/blog/kv-cache-basic-explanation/) で説明したように、KV cache に必要なメモリ量は生成される応答の長さに依存しますが、その長さは事前には分かりません。そのため最大長を想定して事前確保しても、実際の応答はずっと短いかもしれません。

つまり、各リクエストでは確保したメモリの一部しか使わない可能性があります。これにより、いくつかの問題が生じます:
- 各リクエストは独立したメモリブロックを持つため、たとえ 1000 件のリクエストが同じ system prompt を使っていても、他のリクエストと共有できません。つまり KV cache エントリが重複します。
- 理論上は空きメモリがたくさんあっても、それが多数の断片化された連続ブロックに散らばっているせいで使えないことがあります。

## 2.2. PagedAttention のアイデア
**PagedAttention** の中心的なアイデアは驚くほどシンプルです。
> KV cache を固定サイズのブロックに分割し、logical なトークン位置を physical なメモリブロックに対応付ける block table を使う。

この発想は、OS がメモリを固定サイズのページに分割し、page table を使って logical address を physical location に対応付ける仮想メモリとよく似ています。

## 2.3. 単純化したイメージ
Sequence A の logical blocks:
```
[logical block 0] [logical block 1] [logical block 2]
```

Block table:
```
logical block 0 -> physical block 7
logical block 1 -> physical block 2
logical block 2 -> physical block 9
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

モデルから見ると、Sequence A は依然として連続した logical context を持っています。しかし物理的には、KV cache はメモリ上に分散していて構いません。attention kernel は attention 計算の際に block table を使って正しい physical block を見つけます。

# 3. なぜ PagedAttention は推論に役立つのか
PagedAttention が推論に役立つ主な理由は、KV cache メモリの利用効率を改善することです。attention の数式自体は依然として計算する必要があり、計算が安くなるわけではありません。

本当の利点は、PagedAttention によってサーバーがより多くの active sequence を GPU メモリに載せられるようになることです。active sequence が増えるほど、continuous batch は大きくなります。continuous batch が大きいほど、GPU utilization は高まり、throughput も向上します。

## 3.1. 以前の問題: 連続した KV 確保

1 リクエストごとに連続した KV cache 領域を確保する単純なサーバーを想像してみてください。そしてそれが 1000 件の同時リクエストを処理しているとします。

[前回のブログ記事](/blog/kv-cache-basic-explanation/) で説明したように、KV cache に必要な確保量は生成される応答長に依存しますが、それは事前には分かりません。モデルは 32 token 生成するかもしれないし、512 token かもしれないし、4096 token かもしれません。サーバーが確保しすぎればメモリが無駄になり、少なすぎれば再確保が必要になるかもしれません。

単純なサーバーは次のようにメモリを確保するかもしれません。
```
request 1: reserve max 4096 tokens
request 2: reserve max 4096 tokens
request 3: reserve max 4096 tokens
...
```

これにより、リクエスト実行中に **internal fragmentation**（または **over-reservation**）が発生します。つまり、確保はされたままだが、その KV cache の多くが未使用のままという無駄です。
```
reserved memory: 4096 tokens
actually used: 300 tokens
wasted: 3796 tokens
```

さらに別の問題として **external fragmentation** もあります。たとえば GPU の KV memory が次のように 4 つのリクエストに使われているとします:

```
Memory: [ A ][ B ][ C ][ D ] 
```

その後 `B` と `D` が終了すると:

```
Memory: [ A ][   ][ C ][   ] 
```

空きメモリの合計は 2 チャンクありますが、最大の連続空き領域は 1 チャンクしかありません。2 つ連続したチャンクを必要とする新しいリクエストは、合計空き容量が十分でも配置できません。

したがって、各リクエストの KV cache が連続していなければならない場合、external fragmentation によって、実際に使えるメモリは総空き容量よりも小さくなってしまいます。

**PagedAttention はこの両方の問題を軽減します。各リクエストに対して巨大な最大長 KV 領域を 1 つ確保する必要をなくし、さらに 1 つの sequence の logical KV cache 全体を 1 つの連続した physical memory 領域に置く必要もなくします。**

> 聞き覚えがありますか？ これはメモリ管理における古典的な問題であり、OS で paging や segmentation が使われる理由そのものです。

## 3.2. PagedAttention は fragmentation を減らす
**PagedAttention** は、巨大な連続領域を 1 つ確保する必要をなくします。代わりに、小さな固定サイズの KV block（**vllm** のデフォルトは 16）を必要に応じて割り当てます。

たとえば、50 token のリクエストには 4 block 必要で、最初の 3 block にはそれぞれ 16 token ずつ入り、最後の block には 2 token だけ入ります。**つまりメモリの無駄は各 sequence の最後の block にしか発生しません。**

block size を `B` とすると、1 つの sequence で無駄になるのは最大でも `B - 1` token 分の KV cache です。これは、すべてのリクエストに対して `max_seq_len` 分のメモリを予約するよりはるかに良いです。

*利用可能な KV memory が増えるほど、より多くの active sequence が収まり、サーバーはより多くのリクエストを受け入れられ、throughput は改善します。*

## 3.3. PagedAttention はリクエスト間で KV cache も共有できる
LLM の downstream application では、複数のリクエストが同じ system prompt を持つことがあります。その場合、KV cache エントリは重複します。

単純なシステムでは、sample ごとに prompt KV cache を複製してしまうかもしれません。PagedAttention では、複数の sequence 間で physical KV block を共有できます。複数の logical sequence が同じ physical block を指すことができます。sequence が cache を変更または拡張する必要があるときは、reference counting と copy-on-write を使えます。

[vLLM のブログ](https://vllm.ai/blog/2023-06-20-vllm) ではこの block sharing の仕組みが説明されており、parallel sampling、beam search、prefix reuse におけるメモリオーバーヘッドを減らせると述べられています。

概念的には、これは OS が複数プロセス間でメモリページを共有する方法に似ています。

# 4. トレードオフ
PagedAttention は強力ですが、コストなしではありません。
## 4.1. より複雑な attention kernel
通常の attention kernel は、KV memory が連続している前提で実装できます。

PagedAttention では、block table の参照と非連続メモリアクセスが必要になります。これにより kernel はより複雑になります。

vAttention の論文 [2](#reference) でも、PagedAttention は KV cache の仮想メモリレイアウトを連続配置から非連続配置へ変えるため、プログラミング上および性能上のオーバーヘッドを導入しうると明示されています。

## 4.2. gather オーバーヘッドの可能性
KV block は物理的に連続していないため、kernel は異なるメモリ位置からデータを gather する必要があるかもしれません。実装が悪いと、これによって memory coalescing が損なわれます。高性能な PagedAttention には、*ハードウェアアーキテクチャに強く依存する慎重なレイアウト設計* が必要です。

PagedAttention は、単に KV tensor を Python の list に入れれば得られるようなものではありません。allocator と kernel は一体で設計される必要があります。

## 4.3. block size の調整
block size が小さすぎると:
- block table entry が増える
- metadata overhead が増える
- lookup overhead が増える

block size が大きすぎると:
- 最後の block での無駄が増える
- 柔軟なメモリ割り当てがしづらくなる

したがって block size は、メモリ効率と kernel/runtime overhead の間のトレードオフです。

# 5. 結論
PagedAttention は、KV cache のための仮想メモリとして理解するのが最も分かりやすいです。

従来の LLM serving が苦しいのは、各リクエストが大きく、動的で、効率的に確保しにくい KV cache を持つからです。サーバーが KV memory を過剰に予約したり、連続配置を要求したりすると、memory fragmentation が active request 数を制限します。すると batching と throughput も直接制限されます。

PagedAttention は、KV cache を固定サイズ block に分割することでこれを解決します。各 sequence は logical block table を持ち、physical block は GPU memory 上のどこにあっても構いません。新しい block は必要になったときだけ割り当てられます。メモリの無駄はほとんどの場合、各 sequence の最後の block に限定されます。

その結果、attention の数式が消えるわけではありません。結果として得られるのは、推論サーバーがより多くの sequence を生かしたままにでき、より多くの decode step をまとめて batch でき、GPU をより効率的に使えるようになることです。

これが PagedAttention が重要な理由です。KV cache を、壊れやすい連続領域の確保問題から、柔軟な block 管理問題へと変えるからです。本番 LLM serving において、この違いは、遅くて memory-bound なサーバーになるか、高スループットな inference engine になるかを分けることがよくあります。

## Reference
[1] Kwon, W., Li, Z., Zhuang, S., Sheng, Y., Zheng, L., Ying, C., ... & Shen, H. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention. In Proceedings of the 29th Symposium on Operating Systems Principles (SOSP).

[2] Prabhu, R., Nayak, A., Mohan, J., Ramjee, R., & Panwar, A. (2024). vAttention: Dynamic Memory Management for Serving LLMs without PagedAttention. arXiv preprint arXiv:2405.04437.
