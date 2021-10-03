// @name::bandcamp
// @author::me
// @homepage::bandcamp.com
// @version::1.0

var data = {'user':{'type':'str','value':''},'pass':{'type':'str','value':''}};

function search(query, page){
    var songs = JsUtil.newList();

    var url = "https://bandcamp.com/search?q="+query+"&page="+(page+1);
    var response = httpClient.get(new Request.Builder().url(url).build());
    var doc = Jsoup.parse(response.getBody());
    var elements = doc.selectFirst('ul.result-items').select('li.searchresult');
    for(i=0; i<elements.size(); i++){
        var e = elements.get(i);
        covere = e.selectFirst("img");
        scover = '';
        if(covere != null)
            scover = covere.attr('src');
        stype = e.selectFirst('div.itemtype').ownText();
        sname = e.selectFirst('div.heading').selectFirst('a').ownText();
        surl = e.selectFirst('div.itemurl').selectFirst('a').ownText();

        if(stype.includes('TRACK')){
            songs.add(new ExternalSong(surl, sname, "", surl, scover, JsUtil.newMap()));
        }else{
            songs.add(new ExternalSongContainer(surl, sname, stype, surl, scover, JsUtil.newMap(), stype));
        }
    }
    return songs;
}

function fetchContainerInfo(container, page){
    var songs = JsUtil.newList();
    if(page == 0){
        var path = container.getPath();
        if(container.getEtype() == 'ARTIST'){
            path += '/music';
        }

        var response = httpClient.get(new Request.Builder().url(path).build());
        var doc = Jsoup.parse(response.getBody());
        
        var data = {};
        var elements = doc.select("script");
        for(var i =0; i<elements.size(); i++){
            var e = elements.get(i);
            if(e.toString().includes('data-tralbum=')){
                data = JSON.parse(e.attr('data-tralbum'));
                break;
            }
        }

        if(data.url.includes('/track/') || data.url.includes('/album/')){
            for(var i=0; i<data.trackinfo.length; i++){
                var t = data.trackinfo[i]
                songs.add(new ExternalSong(baseUrl(data.url) + t.title_link, t.title, '', t.file['mp3-128'], container.getCoverUrl(), JsUtil.newMap()));
                out.println(baseUrl(data.url) + t.title_link);
            }
        }else {
            var elements = doc.selectFirst('div.leftMiddleColumns').select('li');
            for(var i=0; i<elements.size(); i++){
                var e = elements.get(i);
                sname = e.selectFirst('p.title').ownText();
                scover = e.selectFirst('img').attr('src');
                spath = e.selectFirst('a').attr('href');

                if(scover.startsWith('/')){
                    scover = e.selectFirst('img').attr('data-original');
                }
                if(spath.startsWith('/')){
                    spath = baseUrl(data.url) + spath;
                }

                if(spath.includes('/album/')){
                    songs.add(new ExternalSongContainer(spath, sname, 'ALBUM', spath, scover, JsUtil.newMap(), 'ALBUM'));
                }else if(spath.includes('/track/')){
                    songs.add(new ExternalSong(spath, sname, '', spath, scover, JsUtil.newMap()));
                }
            }
        }
    }
    return songs;
}

function fetchSongInfo(song){
    var id = song.getId();
    out.println(id)
    var response = httpClient.get(new Request.Builder().url(id).build());
    var doc = Jsoup.parse(response.getBody());
    var data;
    var elements = doc.select("script");
    for(var i=0; i<elements.size(); i++){
        var e = elements.get(i);
        if(e.toString().includes('data-tralbum=')){
            data = JSON.parse(e.attr("data-tralbum"));
            break;
        }
    }
    for(var i=0; i<data.trackinfo.length; i++){
        song.setPath(data.trackinfo[i].file['mp3-128']);
        out.println(data.trackinfo[i].file['mp3-128']);
    }
}


function baseUrl(url){
    var pathArray = url.split( '/' );
    var protocol = pathArray[0];
    var host = pathArray[2];
    return protocol + '//' + host;
}
