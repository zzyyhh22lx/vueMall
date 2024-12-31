<template>
    <div>
      <div class="index-wrapper">
        <mall-header v-on:initscroll="scrollTop" :isSeen="false"></mall-header>
        <mall-bread>
        <span>秒杀频道</span>
        </mall-bread>
        <div class="accessory-result-page accessory-page">
          <div class="container" ref="accHock">
            <div class="activity-container">
                <div class="activity-top">
                    <h1>限时秒杀，快来抢购</h1>
                    <h3>秒杀倒计时：{{ countDownTime }}</h3>
                </div>
            <div class="accessory-list-wrap">
                <div class="accessory-list col-4" v-if="checkGoodsLen" style="width: 100%; display: flex;justify-content: flex-start;align-items: center; flex-wrap: wrap;">
                  <ul v-for="(item,index) in list" :key="index" style="margin:10px 20px; width: 250px;">
                    <li style="width: 100%;">
                      <div class="pic">
                        <a href="#"><img v-lazy="`static/${item.productImg}`" alt=""></a> <!--v-lazy图片懒加载-->
                      </div>
                      <div class="main">
                        <div class="name">{{ item.productName }}<span style="color: rgb(217,131,131);display: block; font-size: 12px;">库存：{{ item.limit_num }}</span></div>
                        <div class="details"><a href="javascript:;" title="详情" style="font-size: 12px;color: #8f8f8f;">详情: {{item.productDetails}}</a></div>
                        <div class="price"><span style="text-decoration: line-through; color:#8f8f8f">¥{{ item.productPrice }}</span> -> {{ item.productPrice - (~~item.declinePrice) }} </div>
                        <div class="btn-area">
                          <a v-if="item.limit_num > 0" :class="{'btn--pay':payC}" class="btn btn--m" style="background: #d1434a; color:#fff;width: 100%"  @click="buy(item)">立即抢购</a>
                          <a v-else href="javascript:;" class="btn btn--m" style="background: #d1434a; color:#fff;width: 100%;background: rgb(186 186 186);border: none; cursor: not-allowed;">库存已售罄</a>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div v-if="!checkGoodsLen" style="width:100%; height:100%;">
                    <img src="../../static/404.png" alt="">
                </div>
              </div>
            </div>
          </div>
        </div>
        <pay-suc :mdShow="mdShow" v-on:close="closeModal">
          <!-- <p class="paySuc"slot="message"><i class="icon-check_circle"></i>付款成功！</p> -->
          <div class="pay-type" slot="message" v-if="payShow">
          <p style="font-size:14px; font-weight: 700; text-align:right;">*</p>
            <div class="p-title">支付方式</div> 
            <div class="pay-item">
              <div :class="{'active':selectType === index}" v-for="(item,index) in payList" @click="select(index)" >
                <img :src="item.imgUrl">
              </div> 
            </div>
            <div class="com-btn">
              <a class="yes" @click="yesPay">确认付款</a>
            </div>
          </div>
        </pay-suc>
        <mall-footer></mall-footer>
      </div>
    </div>
</template>
<script>
import "../assets/css/base.css"
import "../assets/css/login.css"
import "../assets/css/product.css"
import "../assets/css/checkout.css"
import "../assets/css/icomoon/style.css"
import "../assets/css/goods.css"
import mallHeader from '../components/header.vue'
import mallFooter from '../components/footer.vue'
import mallBread from '../components/navbread.vue'
import paySuc from '../components/paySuc.vue'
// import BScroll from 'better-scroll'
import axios from 'axios'
import { mapState } from 'vuex'
import $ from 'jquery'
export default{
      data() {
          return {
            checkGoodsLen: false,
            countDownTime: '',
            list: [],
            mdShow:false,
            payShow:true,
            payC:false,
            selectType: 0,
            payList:[
                {
                  id:1,
                  imgUrl:'../../static/images/alipay@2x.png'
                },
                {
                  id:2,
                  imgUrl:'../../static/images/weixinpay@2x.png'
                },
                {
                  id:3,
                  imgUrl:'../../static/images/qqpay.png'
                }],
            buyItem: {},
          }
      },
      created() {
      },
      mounted() {
        this.fetchDetail();
      },
      filters:{
        formatMoney: function(value,type) {
          return "¥" + value.toFixed(2) + type;
        }
      },
      computed:{
      },
      methods: {
        closeModal() {
          this.mdShow = false;
          this.payC = false;
        },
        scrollTop() {
          //document.body.scrollTop = 480;
          //console.log(this.$route.query);
          $('html,body').animate({scrollTop:480},500);
        },
        fetchDetail() {
          // 获取秒杀信息
          axios.get('/api/skill/getActivityDetails').then(res=>{
            res = res.data;
            if(res.status === '1') {
              const result = res.result;
              this.startCountdown(result.endTime);
              this.list = result.list;
              this.checkGoodsLen = result.list.length > 0 && Date.now() < result.endTime;
            }
          });
        },
        startCountdown(targetTime) {
            const _this = this;
            function updateCountdown() {
                const now = Date.now();
                const timeLeft = targetTime - now; // 时间差，单位毫秒
                if (timeLeft < 0) {
                    intervalId();
                    _this.countDownTime = "秒杀时间结束！";
                    _this.checkGoodsLen = false;
                    return;
                }
                let days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                let hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                _this.countDownTime = `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`;
            }
            const intervalId = __setInterval(updateCountdown, 8);
            updateCountdown();
            // 系统补偿时间
            function __setInterval(func, delay, ...args) {
                let current = Date.now();
                let timeId = null;
                const task = () => {
                    current += delay;
                    timeId = setTimeout(() => {
                        func.apply(this, ...args);
                        task();
                    }, current - Date.now());
                }
                task();
                return () => {
                    clearTimeout(timeId);
                    timeId = null;
                }
            }
        },
        select(type) {
          this.selectType = type;
          if(type === 0) {
            this.payType = '../../static/images/payali.png';
            this.payTitle = '打开支付宝';
          } else {
            this.payType = '../../static/images/weixin.png';
            this.payTitle = '打开微信';
          }
        },
        buy(item) {
          this.payC = true;
          console.log(item);
          this.mdShow = true;
          this.buyItem = item;
        },
        yesPay() {
          axios.get('/api/users/addressList').then((res) => {
            res = res.data;
            if(res.status === '1') {
              const addressData = res.result.filter(item => item.isDefault === 1);
              if (addressData.length === 0) {
                this.$message({
                  message: '请先添加默认地址',
                  type: 'error'
                });
                setTimeout(() => {
                  this.$router.push({
                    path:`/addresslist`
                  });
                }, 1000);
                return;
              }
              axios.post('/api/skill/skill-product',{
                pay_type: this.selectType,
                streetName: addressData[0].streetName,
                postCode: addressData[0].postCode,
                tel: addressData[0].tel,
                postName: addressData[0].userName,

                productId: this.buyItem.productId,
              }).then(res=>{
                res = res.data;
                if(res.status === '1') {
                  this.mdShow = false;
                  this.$message({
                    message: res.msg,
                    type: 'success'
                  });
                } else {
                  this.$message({
                    message: res.msg,
                    type: 'error'
                  });
                }
                this.fetchDetail();
                this.buyItem = {};
                this.mdShow = false;
              });
            }else{
              console.log(res.msg);
            }
          });
        }
      },
      components: {
        mallHeader,
        mallFooter,
        mallBread,
        paySuc
      }
    }
</script>
<style lang="scss" scoped>
.activity-container {
  margin: 60px 40px 30px 40px;
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  .activity-top {
    text-align: center;
    h1 {
        color: #ac6b24;
        font-weight: 700;
        margin-bottom: 10px;
    }
    h3 {
        color: rgb(209, 67, 74);
        font-weight: 600;
        margin-top: 10px;
        margin-bottom: 10px;
    }
  }
}
</style>
