document.getElementById('button').onclick = function () {
  const name_data = document.getElementById('name').value
  const email_data = document.getElementById('email').value
  const password_data = document.getElementById('password').value
  const data = {
    name: `${name_data}`,
    email: `${email_data}`,
    password: `${password_data}`
  }
  fetch('/api/1.0/user/signup', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  }).then(function (response) {
    if (response.status === 200) {
      return response.json() // 內建promise , send type need json
    } else if (response.status === 429) {
      alert('Too Many Requests')
    }
  }).then(data => {
    if (data.message) {
      alert(data.message.message)// "email duplicate!!!" or //sign up!!!
    } else if (data.data) {
      console.log(data.data)
      const token = (data.data.access_token)
      localStorage.setItem('token', `${token}`)
      window.location.assign('/user/profile')
    }
  })
    .catch(function (err) {
      console.log('Err message:', err)
    })
}
