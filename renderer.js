const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

// Example of invoking the 'ping' handler in the main process
const func = async () => {
  const response = await window.versions.ping()
  console.log(response) // prints out 'pong'
}

func()