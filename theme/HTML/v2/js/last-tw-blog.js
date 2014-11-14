function loadScript(url, callback){

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            //callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function twitterCallback2(twitters) {
  var username = twitters[0].user.screen_name;
  if (!username)
  {
    username = '';
  }
  var statusHTML = ['<div class="block-title">Twitter feed</div><a class="twfd-author" href="http://twitter.com/'+username+'" target="_blank">@'+username+'</a>'];
  for (var i=0; i<twitters.length; i++){
    var status = twitters[i].text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function(url) {
      return '<a href="'+url+'">'+url+'</a>';
    }).replace(/\B@([_a-z0-9]+)/ig, function(reply) {
      return  '<a href="http://twitter.com/'+reply.substring(1)+'">'+ reply.charAt(0) + reply.substring(1)+'</a>';
    }).replace(/\B#([_a-z0-9а-я]+)/ig, function(hashtag) {
      return '<a href="http://twitter.com/search?q=%23'+hashtag.substring(1)+'">'+hashtag+'</a>';
    });
    statusHTML.push('<div class="blog-tweet">' +status+ '<span>'+relative_time(twitters[i].created_at)+'</span></div>');
  }
  document.getElementById('twitterfeed').innerHTML = statusHTML.join('');
}

function relative_time(time_value) {
  var values = time_value.split(" ");
  time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
  var parsed_date = Date.parse(time_value);
  var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
  var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
  delta = delta + (relative_to.getTimezoneOffset() * 60);

  if (delta < 60) {
    return 'less than a minute ago';
  } else if(delta < 120) {
    return 'about a minute ago';
  } else if(delta < (60*60)) {
    return (parseInt(delta / 60)).toString() + ' minutes ago';
  } else if(delta < (120*60)) {
    return 'about an hour ago';
  } else if(delta < (24*60*60)) {
    return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
  } else if(delta < (48*60*60)) {
    return '1 day ago';
  } else {
    return (parseInt(delta / 86400)).toString() + ' days ago';
  }
}

