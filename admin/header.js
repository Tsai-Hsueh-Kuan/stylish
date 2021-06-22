const input_search = document.getElementById('search')
input_search.addEventListener('keyup', function (event) {
  if (event.keyCode === 13) {
    const search_item = document.getElementById('search').value
    return window.location.assign(`/search?keyword=${search_item}`)
  }
})
if (localStorage.getItem('cart')) {
  const cart_length = (localStorage.getItem('cart').split('///')).length
  document.getElementById('count').textContent = `${cart_length}`
} else {
  document.getElementById('count').textContent = '0'
}
