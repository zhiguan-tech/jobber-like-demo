1> 首先要先编辑 steps/product 的内容，这些内容在 quote job 等模块都需要用
2> 然后要看 客户存不存在，需要参考 steps/client 
3> 然后是 创建 steps/quote 基于某一个 client
4> 只有 被approved 的 quote，才可以转成 一个 task，不可以直接从 quote 转成 job,  steps/tasks   一个 qoute 对应一个 task
5> 每次创建 job 都要去显示在 task 里面，也就是一个 task 会有多个 job。 
  一个 task 可以生成多个 job 根据 product 来分配， 然后每个 job 都可以有多个 visit。
6> 然后 每一个job 完成后 都会生成 对应的 invoice   steps/invoice
