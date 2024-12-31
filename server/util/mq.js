var mysql = require('mysql');
var $conf = require('../conf/conf');
// 使用连接池
var pool = mysql.createPool($conf.mysql);
class SimpleMQ {
    constructor() {
        this.queue = [];  // 用数组来存储消息
        this.listeners = [];  // 监听者数组
    }

    sendMessage(message) {
        this.queue.push(message);
        this.notifyListeners(); 
    }

    addListener(listener) {
        this.listeners.push(listener);
        this.notifyListeners();
    }

    notifyListeners() {
        Promise.resolve().then(() => {
            while (this.queue.length > 0) {
                const message = this.queue.shift();
                this.listeners.forEach(listener => listener(message));
            }
        });
    }
}

const mq = new SimpleMQ();

mq.addListener(message => {
    console.log("消费者1收到消息:", message);
});

mq.addListener(message => {
    let sql = "insert into orderlist(orderId,userId,productId,productName,productPrice,productNum,productImg,postName,streetName,postCode,tel,totalPrice,itemPrice,discount,shipPrice,freightRisk,createDate,ifPay) values (?)";
    pool.query(sql, [message], (err, result) => {
        if(err) {
            console.error(err, '秒杀商品设置失败');
            return;
        } else {
            console.log('秒杀商品数据设置成功...');
        }
    })
});

module.exports = mq;