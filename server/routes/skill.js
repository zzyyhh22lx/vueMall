const redis = require('redis');
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var $conf = require('../conf/conf');
var my = require('../util/mq.js');
const crypto = require('crypto-js');
// 使用连接池
var pool = mysql.createPool($conf.mysql);
router.use(express.static('public'));

const client = redis.createClient({
  host: '127.0.0.1',
  port: 6379,       // Redis服务器端口，默认为6379
});

client.on('error', (error) => {
  console.error(`Error connecting to Redis: ${error}`);
});

// ip限制，这里简单实现
const ipRestrict = [];
const maxHightVisitNum = 10;

// 录入的秒杀活动数据，应该b端平台配置，数据下发，而且引擎那边应该需配置干预召回时去除秒杀商品数据，防止缓存库存和数据库不一致
const productIDList = ['10001', '10002', '10003', '10004', '10005']; // 商品Id list
const declinePrice = ['10', '20', '30', '40', '90']; // 秒杀活动下降价格
const startTime = Date.now(); // 秒杀活动开始时间,这里我简单实现，就用当前时间，作为秒杀活动开始时间，按理来说，应该有一个定时器进程来控制秒杀活动的开始和结束时间和数据缓存
const durationTime = 10000000; // 秒杀活动持续时间
const endTime = startTime + durationTime; // 秒杀活动结束时间

const skillMap = new Map();

client.on('connect', () => {
  console.log('Connected to Redis successfully');
  // 初始化商品数据
  const sql = 
  `SELECT *
  FROM goods
  WHERE productId IN (${productIDList.map(id => `'${id}'`).join(', ')});`;
  pool.query(sql, (err, result) => {
    if(err) {
        console.error(err, '读取秒杀商品数据失败');
        return;
    } else {
        console.log('读取秒杀商品数据成功...');
        result.forEach((item, index) => {
            const declineItemPrice = declinePrice[index];
            item.declinePrice = declineItemPrice;
        })
        client.set('skillProductList', JSON.stringify(result), (err, reply) => {
            if(err) {
                console.error(err, '缓存设置秒杀商品数据失败');
                return;
            }
            console.log('缓存设置秒杀商品数据成功...');
        })
    }
  })
});

router.get('/getActivityDetails', function(req, res, next) {
    client.get('skillProductList', (err, result) => {
        if (err) {
            console.log(err);
            res.json({
                status:'-1',
                msg:err.message
            });
        }
        res.json({
            status:'1',
            msg:'',
            result: {
                startTime,
                durationTime,
                endTime,
                list: JSON.parse(result),
            }
        });
    });
})

router.get('/generate-seckill-url', function(req, res, next) {
})

router.post('/skill-product', function(req, res, next) {
    const host = req.header.host;
    console.log(req.cookies);
    if (ipRestrict.length >= maxHightVisitNum || ipRestrict.includes(host)) {
        res.json({
            status:'-1',
            msg:'访问过于频繁，请稍后再试'
        });
        return;
    }
    ipRestrict.push(host);
    const {
        productId,
        pay_type,
        streetName,
        postCode,
        tel,
        postName,
     } = req.body;
    const freightRisk = '5', shipPrice = '5';
    let userId = req.cookies.userId;
    var platform = '622';
    var r1 = Math.floor(Math.random()*10);
    var r2 = Math.floor(Math.random()*10);
    var sysDate = new Date().Format('yyyyMMddhhmmss');
    var orderIdVal = platform+r1+sysDate+r2;
    if (skillMap.has(userId)) {
        const userMap = skillMap.get(userId);
        if (userMap.includes(productId)) {
            ipRestrict.splice(ipRestrict.indexOf(host), 1);
            res.json({
                status:'-1',
                msg:'您已秒杀过该商品'
            });
            return;
        }
    }
    client.get('skillProductList', (err, result) => {
        if (err) {
            console.log(err);
            res.json({
                status:'-1',
                msg:err.message
            });
            return;
        }
        result = JSON.parse(result);
        console.log(productId, result);
        const product = result.find(item => item.productId === productId);
        if (product.limit_num <= 0) {
            ipRestrict.splice(ipRestrict.indexOf(host), 1);
            res.json({
                status:'-1',
                msg:'商品库存不足'
            });
            return;
        } 
        product.limit_num--;
        client.set('skillProductList', JSON.stringify(result), (err, reply) => {
            if (err) {
                console.log(err);
                res.json({
                    status:'-1',
                    msg:err.message
                });
                return;
            }
            console.log(productId, '商品库存-1');
            ipRestrict.splice(ipRestrict.indexOf(host), 1);
            if (skillMap.has(userId)) {
                const userMap = skillMap.get(userId);
                userMap.push(productId);
                skillMap.set(userId, userMap);
            } else {
                skillMap.set(userId, [productId]);
            }
            const values = [
                orderIdVal,
                userId,
                productId,
                product.productName,
                product.productPrice,
                product.productNum,
                product.productImg,
                postName,
                streetName,
                postCode,
                tel,
                String(product.productPrice - ~~product.declinePrice + ~~freightRisk + ~~shipPrice),
                String(product.productPrice),
                product.declinePrice,
                shipPrice,
                freightRisk,
                new Date().Format('yyyy-MM-dd hh:mm:ss'),
                1
            ]
            my.sendMessage(values);
            res.json({
                status:'1',
                msg: '秒杀成功'
            });
        })
    });
})
module.exports = router;