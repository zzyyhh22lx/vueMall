秒杀系统：

1. 单机器，分布式（不搞）
2. ip限流，过滤，每次只支持xxx个用户同时秒杀（读写数据）
<!-- 3. 秒杀url设计，接口url加密实现动态化，防止通过下单页面url直接访问后台接口来秒杀货品
> md5加密一串随机字符作为秒杀的url，然后前端访问后台获取具体的url，后台校验通过之后才可以继续秒杀。 -->
4. 内存缓存，redis缓存，扣减库存，活动开始时同步数据源，活动预热
5. 异步下单，rabbitmq发送队列，异步处理，
> 入库没有问题可以用短信通知用户秒杀成功。假如失败的话,可以采用补偿机制，重试。
