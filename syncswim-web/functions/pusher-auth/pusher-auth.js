const process = require('process')
const Pusher = require('pusher')

const handler = async function (event) {
  const pusher = new Pusher({
    appId: "1360895",
    key: "b58c86cc70863ba9db82",
    secret: process.env.PUSHER_APP_SECRET,
    cluster: "us3"
  })

  try {
    const { socketId, channel } = event.queryStringParameters
    const auth = pusher.authenticate(socketId, channel)
    return {
      statusCode: 200,
      body: JSON.stringify(auth),
    }
  } catch (error) {
    const { data, headers, status, statusText } = error.response
    return {
      statusCode: error.response.status,
      body: JSON.stringify({ status, statusText, headers, data }),
    }
  }
}

module.exports = { handler }
