const fs = require('fs');
const path = require('path');
const _ = require('lodash');


const art = require('express-art-template');
const pug = require('pug');
const ejs = require('ejs');
const dot = require('dot');
const handlebars = require('handlebars');


const defaults =  JSON.parse(fs.readFileSync(__dirname+'/nviewRenderConfig.json'));

class NViewRender {
    constructor(config){
        this.config =  _.defaults(config,defaults);
    }
    compileByType(tplType,str,data){
        let htmlString;
        if(!tplType||!str||!data){
            return ''
        }
        switch (tplType.toLowerCase()){
            case 'ejs':
                htmlString = ejs.render(str,data);
                break;
            case 'dot':
                let render = dot.template(str);
                htmlString = render(data);
                break;
            case 'pug':
                htmlString = pug.render(str,data);
                break;
            case 'art':
                htmlString = art.template.render(str,data);
                break;
            case 'handlebars':
                let template = handlebars.compile(str);
                htmlString = template(data);
                break;
            default:
                htmlString = ejs.render(str,data);
                break;
        }
        return htmlString;
    }
    getFileUri(page,compileConfig){
        const extName = path.extname(compileConfig.path + page);
        let fileURI;

        if(extName === ''){
            fileURI = compileConfig.path+ page +'.'+ compileConfig.defaultEngine;
        }else if(extName === '.'){
            fileURI = compileConfig.path+ page + compileConfig.defaultEngine;
        }else{
            fileURI = compileConfig.path+ page
        }
        return fileURI;
    }
    getFileStr(fileURI){
        try{
            return fs.readFileSync(fileURI, this.config.charset);
        }catch(e) {
            throw 'Path Error,Cannot find file : ' + fileURI;
        }
    }

    compileByUri(data,page,config){
        const compileConfig = config ? _.defaults(config,this.config):this.config;
        const fileURI  = this.getFileUri(page,compileConfig);
        const extName = path.extname(fileURI);
        let str,type,dataModel;
        const setParam = () =>{
            str = this.getFileStr(fileURI);
            type = compileConfig.ext[extName.split('.')[1].toLowerCase()] || compileConfig.defaultEngine;
            dataModel = Object.prototype.toString.call(data) === '[object Object]' ? data : JSON.parse(data);
        };
        if(compileConfig.async){
            return new Promise((resolve, reject) =>{
                try{
                    setParam();
                    resolve(this.compileByType(type,str,dataModel));
                }catch(e){
                    reject(e);
                }
            })
        }else{
            setParam();
            return this.compileByType(type,str,dataModel);
        }

    }

}

//todo beforeRender/afterRender callback  /param fixed / return fixed / error

module.exports = NViewRender;
