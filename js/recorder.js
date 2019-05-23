/*
* recorder.js 录制音频并输出为MP3格式
* https://github.com/devin87/mp3-recorder
* author:devin87@qq.com  
* update:2015/12/30 08:58
*/
(function (window, undefined) {
    "use strict";

    //浏览器兼容
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    //优先使用MediaRecorder
    var MediaRecorder = window.MediaRecorder;

    //navigator.getUserMedia已被废除，建议使用 navigator.mediaDevices.getUserMedia
    var mediaDevices = navigator.mediaDevices,
        getUserMedia = mediaDevices ? mediaDevices.getUserMedia : undefined;

    if (mediaDevices && mediaDevices.getUserMedia) {
        navigator.getUserMedia = function (ops, success, error) {
            return mediaDevices.getUserMedia(ops).then(success).catch(error);
        };
    } else if (!navigator.getUserMedia) {
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }

    //MP3音频录制
    function MP3Recorder(ops) {
        ops = ops || {};

        var self = this;
        self.bufferSize = ops.bufferSize || 16384;
        self.numChannels = ops.numChannels || 1;
        self.bitRate = ops.bitRate || 128;

        self.ops = ops;

        //录音支持检测
        self.support = !!(window.AudioContext && navigator.getUserMedia && window.Worker);
    }

    MP3Recorder.prototype = {
        constructor: MP3Recorder,

        //开始录音
        start: function (success, error) {
            var self = this;

            if (!self.support) return error && error({ code: "NOT_SUPPORTED_ERROR" });

            var ops = self.ops,
                onComplete = ops.complete,
                onError = ops.error;

            navigator.getUserMedia({ audio: true, video: false }, function (stream) {
                //优先使用 MediaRecorder
                if (MediaRecorder && ops.useMediaRecorder !== false) {
                    var recorderType = ops.recorderType;
                    var recorder = new MediaRecorder(stream, recorderType && MediaRecorder.isTypeSupported(recorderType) ? { mimeType: recorderType } : undefined);

                    var data = [];
                    recorder.addEventListener('dataavailable', function (e) {
                        if (self._paused) return;

                        if (e.data.size > 0) {
                            data.push(e.data);
                        }
                    });

                    recorder.addEventListener('stop', function () {
                        var ops = self.ops,
                            onComplete = ops.complete,
                            blob = data[0],
                            ext = blob ? (blob.type || "").match(/^[^\/]+\/([^;]+);?.*?$/)[1] || "" : "";

                        if (onComplete) onComplete(blob, ext ? "." + ext : "");
                    });

                    recorder.start();

                    self.recorder = recorder;
                } else {
                    var context = new AudioContext(),
                        worker = new Worker(ops.WORKER_PATH || 'js/recorder-worker.js');

                    worker.onmessage = function (e) {
                        var obj = e.data, data = obj.data;

                        switch (obj.cmd) {
                            case "complete":
                                if (onComplete) onComplete(new Blob(data, { type: "audio/mp3" }), ".mp3");
                                break;

                            case "error":
                                if (onError) onError(data);
                                break;
                        }
                    };

                    self.inputSampleRate = context.sampleRate;
                    self.outputSampleRate = ops.sampleRate || self.inputSampleRate;

                    worker.postMessage({
                        cmd: "init",
                        data: {
                            numChannels: self.numChannels,
                            sampleBits: self.sampleBits,
                            inputSampleRate: self.inputSampleRate,
                            outputSampleRate: self.outputSampleRate,
                            bitRate: self.bitRate
                        }
                    });

                    self.context = context;
                    self.worker = worker;

                    var numChannels = self.numChannels,

                        source = context.createMediaStreamSource(stream),
                        processor = (context.createScriptProcessor || context.createJavaScriptNode).call(context, self.bufferSize, numChannels, numChannels);

                    processor.onaudioprocess = function (e) {
                        if (self._paused) return;

                        var data = [], i = 0;
                        for (; i < numChannels; i++) {
                            data.push(e.inputBuffer.getChannelData(i));
                        }

                        worker.postMessage({ cmd: "encode", data: data });
                    };

                    source.connect(processor);
                    processor.connect(context.destination);

                    self.source = source;
                    self.processor = processor;
                }

                if (typeof success == "function") success();

            }, error);
        },
        //暂停录音
        pause: function () {
            this._paused = true;
        },
        //恢复录音
        resume: function () {
            this._paused = false;
        },
        //停止录音
        stop: function () {
            var self = this;
            if (self.recorder) self.recorder.stop();
            if (self.source) self.source.disconnect();
            if (self.processor) self.processor.disconnect();
            if (self.worker) self.worker.postMessage({ cmd: "stop" });
        }
    };

    //---------------- export ----------------
    window.MP3Recorder = MP3Recorder;

})(window);