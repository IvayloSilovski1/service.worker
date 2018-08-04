const client_id = '810189120663-dnu6rdtdqbqb46phm86ggiida639kr2r.apps.googleusercontent.com';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');
const defaultChannel = 'techguyweb';

//form submit and change channel
channelForm.addEventListener('submit', e => {
  e.preventDefault();

  const channel = channelInput.value;
  getChannel(channel);
});

// load auth2 library
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

// init api client librabry and set up sign in listeners
function initClient() {
  gapi.client.init({
    discoveryDocs: DISCOVERY_DOCS,
    clientId: client_id,
    scope: SCOPES
  }).then(() => {
    // listen for sign in state change
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    // handle initial sign in state
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}


// update UI sign in state changes
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    content.style.display = 'block';
    videoContainer.style.display = 'block';
    getChannel(defaultChannel);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    content.style.display = 'none';
    videoContainer.style.display = 'none';
  }
}

// handle login
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}

// handle logout
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

// display channel data
function showChannelData(data) {
  const channelData = document.getElementById('channel-data');
  channelData.innerHTML = data;
}

// get channel from API
function getChannel(channel) {
  gapi.client.youtube.channels.list({
      part: 'snippet, contentDetails,statistics',
      forUsername: channel
    })
    .then(res => {
      console.log(res);
      const channel = res.result.items[0];
      const output = `
        <ul class="collection">
          <li class="collection-item">
            Title: ${channel.snippet.title}
          </li>
           <li class="collection-item">
            ID: ${channel.id}
          </li>
           <li class="collection-item">
            Subscribers: ${numberWithCommas(channel.statistics.subscriberCount)}
          </li>
           <li class="collection-item">
            Views: ${numberWithCommas(channel.statistics.viewCount)}
            Videos: ${numberWithCommas(channel.statistics.videoCount)}
          </li>
        </ul>
        <p>${channel.snippet.description}</p>
        <hr>
        <a class="btn grey darken-2" href="https://youtube.com/${channel.snippet.customUrl}" target="_blank">Visit Channel</a>
      `;
      showChannelData(output);

      const playlistId = channel.contentDetails.relatedPlaylists.uploads;
      requestVideoPlaylist(playlistId);
    })
    .catch(err => alert('No Channel With That Name Found!'));
}

// setting commas to numbers
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function requestVideoPlaylist(playlistId) {
  const requestOptions = {
    playlistId: playlistId,
    part: 'snippet',
    maxResults: 12
  }

  const request = gapi.client.youtube.playlistItems.list(requestOptions);
  request.execute(res => {
    console.log(res);
    const playlistItems = res.result.items;
    if (playlistItems) {
      let output = '<br><h4 class="center-align">Latest Videos</h4>';
      // loop throught videos and append output
      playlistItems.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;
        output += `
          <div className="col s3">
            <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          </div>
        `;
      });

      // output videos
      videoContainer.innerHTML = output;
    } else {
      videoContainer.innerHTML = 'No Uploaded Videos';
    }
  });
}