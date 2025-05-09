
// document.addEventListener('DOMContentLoaded', ()=>{    
    const socket = io()

const msgContainer = document.querySelector('.msgContainer')
const privateMsgForm = document.getElementById('privateMessageForm')
const inputText = document.getElementById('input')

socket.on('receive-message', (data)=>{
    console.log(data)
    displayMessage(data.from,data.msg, 'incomming')
})
privateMsgForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    const msg = inputText.value
    console.log(msg)
    showMessages('me', msg, 'outGoing')
    // socket.emit('send-private-message', {msg, reciepientId})

})
// reciever attribute user id

const showMessages = (sender, msg, type)=>{
    const li = document.createElement('li')
    li.textContent = `<strong>${sender}</strong> <span>${msg}</span>`
    li.className = type
    li.appendChild(msgContainer)
}



// })
