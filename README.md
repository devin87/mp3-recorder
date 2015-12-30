# mp3-recorder
html5录音并编码为mp3格式，支持采样率和比特率设置。

###简单调用示例

1\. 导入js文件
```html
<script type="text/javascript" src="js/recorder.js"></script>
```

2\. 调用
```js
var recorder = new MP3Recorder({
    numChannels: 1,     //声道数
    sampleRate: 8000,   //采样率
    bitRate: 64,        //比特率

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