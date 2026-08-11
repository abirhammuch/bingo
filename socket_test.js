const fetch = global.fetch || require('node-fetch');
const url = 'https://marshalbingobackend.vercel.app/socket.io/?EIO=4&transport=polling';
(async () => {
  try {
    const res = await fetch(url, { headers: { Origin: 'https://marshalbingobingo.vercel.app' } });
    const body = await res.text();
    console.log('handshake', res.status, body.slice(0,240));
    const match = body.match(/"sid":"([^"]+)"/);
    if (!match) {
      console.error('no sid');
      return;
    }
    const sid = match[1];
    const postUrl = `https://marshalbingobackend.vercel.app/socket.io/?EIO=4&transport=polling&sid=${sid}`;
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        Origin: 'https://marshalbingobingo.vercel.app',
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: '2',
    });
    const postBody = await postRes.text();
    console.log('post', postRes.status, postBody.slice(0,240));
  } catch (error) {
    console.error(error);
  }
})();
