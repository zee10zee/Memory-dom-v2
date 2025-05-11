

const socket = io() // automatically connects to socket of server
const groupMessageContainer = document.getElementById('msgDisplay')
const groupMessageForm = document.getElementById('msgForm')
const groupInputText = document.getElementById('msgInput')
const groupTypingSign = document.querySelector('.typing')



let sender = null;
let typingTimeout;

// joining
 socket.on('join', username =>{
     console.log(username)
     document.querySelector('.joiningAlert').textContent = username
 })

//  on disconnect
socket.on('user-disconnect', (user)=>{
    console.log(user)
    setTimeout(() => {
    document.querySelector('.joiningAlert').textContent = `${user} disonnected`
    }, 2000);
})

 socket.on('typing', data => {
    document.querySelector('.typing').textContent = data
 });
 socket.on('hide typing', data => {
    document.querySelector('.typing').textContent = ''
 });


socket.on('receive message', (message)=>{
    sender = message.sender
    displayMessage(message.sender, message.msg, 'incomming')
})


groupMessageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    displayMessage('me',groupInputText.value, 'outgoing')
    const message = groupInputText.value
    socket.emit('send massage', message)
    groupInputText.value = ''
    updateTheScroll()
})

// on typing 
let isTyping = false;
groupInputText.addEventListener('input', (e)=>{
    e.preventDefault()
    const typer = sender
    socket.emit('typing', 'some one is typing')
    if(!isTyping){
        isTyping = true;
        // clearTimeout(typingTimeout)
            typingTimeout = setTimeout(() => {
            socket.emit('stop typing', 'time to hide')
        }, 3000);

    }
})

function displayMessage(me, msg, type){
    const li = document.createElement('li')
    li.classList.add(type)
    li.innerHTML =`<strong>${me}:</strong> ${msg}`
    groupMessageContainer.appendChild(li)
}

function updateTheScroll(){
    groupMessageContainer.scrollTop = groupMessageContainer.scrollHeight
}