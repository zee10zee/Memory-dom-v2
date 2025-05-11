const container = document.querySelector('.container-private-chat')
const submitForm = document.querySelector('#privateForm')
const formInput = document.querySelector('#privateInput')
const userId = document.querySelector('.userId')
const socket = io()


socket.on('received_private-message', (receivedData)=>{
    console.log(receivedData)
    showMessage(receivedData.message, 'inner')
})
submitForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    const userID = parseInt(userId.getAttribute('reciepient-user-id'))
    const message = formInput.value
   socket.emit('send-private-message', {userid : userID, message : message})
    showMessage(message, 'outer')
    formInput.value =''
    updateScroll()
})


function showMessage(msg, msgType){
   const msgElement = document.createElement('li')
   msgElement.classList.add(msgType)
   msgElement.textContent = msg
   container.appendChild(msgElement)
}

function updateScroll(){
    container.scrollTop = container.scrollHeight
}
