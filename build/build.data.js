//Qbuild 配置文件
module.exports = {
    root: "../",
    output: "dist",

    noStore: true,
    
    cmd: [
        {
            title: "压缩js",

            //cmd: "java -jar D:\\tools\\compiler.jar --js=%f.fullname% --js_output_file=%f.dest%",
            cmd: "uglifyjs %f.fullname% -o %f.dest% -c -m",

            //output: "dist",
            match: "js/*.js",

            replace: [
                //去掉文件头部压缩工具可能保留的注释
                [/^\/\*([^~]|~)*?\*\//, ""]
            ],

            //可针对单一的文件配置 before、after,def 表示默认
            before: [
                {
                    "def": "//devin87@qq.com\n",
                    "lame.all.js": "//zhuker https://github.com/zhuker/lamejs\n"
                },
                "//build:%NOW%\n"
            ]
        }
    ],

    run: ["cmd"]
};