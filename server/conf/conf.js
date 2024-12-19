// conf/db.js
// MySQL数据库联接配置
module.exports = {
	mysql: {
		host: '47.120.1.191', 
		user: 'root',
		password: '123456',
		database:'malldata', // 前面建的user表位于这个数据库中
		port: 3306,
		charset:'UTF8_GENERAL_CI'
	}
};