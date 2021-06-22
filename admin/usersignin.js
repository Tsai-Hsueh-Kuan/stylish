document.getElementById('button').onclick = function () {
  const email_data = document.getElementById('email').value
  const password_data = document.getElementById('password').value
  const data = {
    provider: 'native',
    email: `${email_data}`,
    password: `${password_data}`
  }
  fetch('/api/1.0/user/signin', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  }).then(function (response) {
    if (response.status === 200) {
      return response.json() // 內建promise , send type need json
    } else if (response.status === 403) {
      alert('輸入錯誤')
    } else if (response.status === 429) {
      alert('Too Many Requests')
    }
  }).then(data => {
    console.log(data)
    const token = (data.data.access_token)
    localStorage.setItem('token', `${token}`)
    // window.location.assign('/user/profile')
  })
}
