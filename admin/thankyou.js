const url = location.search
let order_number = ''
for (let i = 1; i < url.length; i++) {
  order_number += url[i]
}
document.getElementById('number').innerHTML = `訂單編號：${order_number}`
localStorage.removeItem('cart')
