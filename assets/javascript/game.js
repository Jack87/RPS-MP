var players = {
    p1 : {
        id:     "",
        name:   "",
        wins:   0,
        losses: 0
    },
    p2 : {
        id:     "",
        name:   "",
        wins:   0,
        losses: 0
    },
    activeSpectators: [],
    totalConnections: 0
};
var user = {
    role: "",
    key:  ""
};

if (1==1) {
    jQuery(function($){
    
    // Cycle plugin
    $('.slides').cycle({
        fx:     'none',
        speed:   250,
        timeout: 5,
        requeueTimeout: 1         

    });
    
    // Pause &amp; play on hover
    $('.slideshow-block').hover(function(){
        $(this).find('.slides').addClass('active').cycle("resume");
        $(this).addClass('bg-none');
    }, function(){
        $(this).find('.slides').removeClass('active').cycle("pause");
        $(this).removeClass('bg-none');

    });
    
    });
    };
// if (1==1) { 
//     jQuery(function($){

//         // Cycle plugin
//         $('.slides').cycle({
//             fx:     'none',
//             speed:   150,
//             timeout: 5
//         }).cycle("pause");

//         // Pause &amp; play on hover
//         $('.slideshow-block').hover(function(){
//             $(this).find('.slides').addClass('active').cycle('resume');
//         }, function(){
//             $(this).find('.slides').removeClass('active').cycle('pause');
//         });

//     });
// };