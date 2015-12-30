# mp3-recorder
html5录音并编码为mp3格式，支持采样率和比特率设置。

###简单调用示例

1\. 导入js文件
```html
<script type="text/javascript" src="js/recorder.js"></script>
```

2\. 调用
```js
//唯一影响mp3文件大小的参数为 bitRate
//sampleRate 仅供特殊需求的人使用
var recorder = new MP3Recorder({
    //numChannels: 1,     //声道数,默认为1
    //sampleRate: 8000,   //采样率,一般由设备提供,比如 48000
    bitRate: 64,        //比特率,不要低于64,否则可能录制无声音（人声）

    //录音结束事件
    complete: function (data, type) {
		//blob为mp3音频数据
        var blob = new Blob(data, { type: type });
    }
});

//开始录音
recorder.start(onSuccess, onError);

//停止录音
recorder.stop();

//暂停录音
recorder.pause();

//恢复录音
recorder.resume();
```