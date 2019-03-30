const ruh = require('./index');

console.log(
//JSON.stringify(
    ruh
        .config({
            file: {
                renderer: v=>"require('./"+v.file.join('/')+"')"
            },
            inherit: {
                processor: (v, ruh)=>{
                    return v.map(x=>ruh.generateObject(x));
                }
            }
        })
        .generateObjectString({
            title: 'hola',
            longTitle: 'hooolaaa',
            image: {
                '@ruhg-attr': 'file',
                //'@ruh-processor': v=>['..', ...v.file],
                value: {
                    file: ['aqui', 'como', 'alla'],

                }
            },
            component: {
                require: true,
                file: ['ruta', 'del', 'archivo'],
                attribute: 'taxi'
            },
            list: {
                '@ruhg-attr': 'inherit',
                value: [
                    {
                        title: 'quetal',
                        list: {
                            '@ruhg-attr': 'inherit',
                            value: [
                                {
                                    longTitle: 'adieuu'
                                }
                            ]
                        }
                    },
                    {
                        title: 'saba'
                    }
                ]
            }
        })
//, null, 2)
);
