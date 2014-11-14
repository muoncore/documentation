$(document).ready(function() 
{
    //img overlays
    $('.container .column, .container .columns').on('mouseover', function()
    {
        var overlay = $(this).find('.overlay-wrp');
        var content = $(this).find('.overlay-content');
        var top = parseInt(overlay.height() * 0.5 - 4);

        overlay.stop(true,true).fadeIn(300);
        content.stop().animate({'top': top}, 400);
        
    }).on('mouseleave', function()
    {
        var overlay = $(this).find('.overlay-wrp');
        var content = $(this).find('.overlay-content');
        var top = parseInt(overlay.height() * 0.2);
        
        content.stop().animate({'top': top}, 100);
        overlay.fadeOut(200);
    });
    
    //loader line fixer
    setTimeout(function()
    {
        $('#homepage .logo, #homepage .line, nav').animate({'opacity': '1'}, 400);
        
    }, 400)
});

