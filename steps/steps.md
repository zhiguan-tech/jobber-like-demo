1> 首先要先编辑 steps/product 的内容，这些内容在 quote job 等模块都需要用
2> 然后要看 客户存不存在，需要参考 steps/client 
3> 然后是 创建 steps/quote 基于某一个 client
4> 在之后是 创建 job。 job 必须基于一个 quote，一个 quote 可以生成多个 job 根据 product 来分配
5> 然后 每一个job 完成后 都会生成 对应的 invoice   steps/invoice
