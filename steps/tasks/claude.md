好的 现在 在   quotes 和 jobs 之间  我希望有一个新的模块  叫做 tasks    逻辑 是

1> 只有 被approved 的 quote，才可以转成 一个 task，不可以直接从 quote 转成 job
2> 对于 tasks list  需要展示 工作完成情况，比如 tasks 有 20个 product A, 50个product B。那么刚开始转成的 task 要显示
0/70 0% 
3> 点进去 task 之后可以要显示 类似于 quote 里面 product，但是这个 product 不可以更改，但是要显示3个东西，1 总量 2 分配量 3 完成量
4> 点进去 task 之后也要显示 一个功能就是 创建/分配 jobs。是的我们是通过task 去分配 job 的，一个job 可以任意的分配 task 里面的各个 products，比如 10个product A 20个 product B, 如果分配出去之后，对应product的分配量要改变
5> 每次创建 job 都要去显示在 task 里面，也就是一个 task 会有多个 job。
