/*
* recorder-worker.js 录制音频并输出为MP3格式
* https://github.com/devin87/mp3-recorder
* author:devin87@qq.com  
* update:2015/12/30 08:58
*/
(function (undefined) {
    "use strict";

    //日志输出
    function log() {
        if (typeof console != "undefined") console.log.apply(console, arguments);
    }

    //发送 worker 数据
    function postMessage(cmd, data) {
        self.postMessage({
            cmd: cmd,
            data: data
        });
    }

    log("mp3 recorder worker started!");

    //导入lame.js以实现mp3编码
    //Worker 内可以使用 importScripts 导入js
    importScripts('./lame.all.js');

    var dataBuffer = [],     //数据缓冲区
        mp3Encoder,          //mp3编码器
        numChannels,         //通道数
        //sampleBits,          //采样位数
        inputSampleRate,     //输入采样率
        outputSampleRate;    //输出采样率

    //添加缓冲数据
    function appendBuffer(buffer) {
        dataBuffer.push(new Int8Array(buffer));
    }

    //清除缓冲数据
    function clearBuffer() {
        dataBuffer = [];
    }

    //初始化
    function init(data) {
        numChannels = data.numChannels || 1;
        inputSampleRate = data.inputSampleRate;
        outputSampleRate = Math.min(data.outputSampleRate || inputSampleRate, inputSampleRate);

        clearBuffer();

        var lame = new lamejs();
        mp3Encoder = new lame.Mp3Encoder(numChannels, outputSampleRate, data.bitRate || 128);
    }

    //数据压缩与转换
    function convertBuffer(buffer) {
        var input;

        //修改采样率
        if (inputSampleRate != outputSampleRate) {
            var compression = inputSampleRate / outputSampleRate,
                length = Math.ceil(buffer.length / compression),
                input = new Float32Array(length),
                index = 0,
                i = 0;

            for (; index < length; i += compression) {
                input[index++] = buffer[~~i];
            }

        } else {
            input = new Float32Array(buffer);
        }

        var length = input.length,
            output = new Int16Array(length),

            i = 0;

        for (; i < length; i++) {
            var s = Math.max(-1, Math.min(1, input[i]));

            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        return output;
    }

    //编码音频数据
    function encode(data) {
        var samplesLeft = convertBuffer(data[0]),
            samplesRight = numChannels > 1 ? convertBuffer(data[1]) : undefined,

            maxSamples = 1152,
            length = samplesLeft.length,
            remaining = length,
            i = 0;

        for (; remaining >= maxSamples; i += maxSamples) {
            var left = samplesLeft.subarray(i, i + maxSamples),
                right = samplesRight ? samplesRight.subarray(i, i + maxSamples) : undefined,

                mp3buffer = mp3Encoder.encodeBuffer(left, right);

            appendBuffer(mp3buffer);
            remaining -= maxSamples;

            //postMessage("progress", 1 - remaining / length);
        }
    }

    function stop() {
        appendBuffer(mp3Encoder.flush());

        postMessage("complete", dataBuffer);

        clearBuffer();
    }

    //---------------- worker ----------------

    self.onmessage = function (e) {
        var obj = e.data, data = obj.data;

        switch (obj.cmd) {
            case "init":
                init(data);
                break;

            case "encode":
                encode(data);
                break;

            case "stop":
                stop();
                break;
        }
    };

})();