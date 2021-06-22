const token = localStorage.getItem('token')
fetch('/admin/check', {
  method: 'GET',
  headers: { authorization: `Bearer ${token}` }
}).then(function (response) {
  if (response.status === 200) {
    return response.json() // 內建promise , send type need json
  } else if (response.status === 401) {
    alert('請先登入')
    return window.location.assign('/user/signin')
  } else if (response.status === 403) {
    alert('無權限,請重新登入')
    return window.location.assign('/user/signin')
  }
}).then(data => {
  return data
})
  .catch(function (err) {
    return err
  })
