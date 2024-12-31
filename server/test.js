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
        while (this.queue.length > 0) {
            const message = this.queue.shift();
            this.listeners.forEach(listener => listener(message));
        }
    }
}

const mq = new SimpleMQ();

mq.addListener(message => {
    console.log("消费者1收到消息:", message);
});

mq.addListener(message => {
    
});

mq.sendMessage("Hello World");