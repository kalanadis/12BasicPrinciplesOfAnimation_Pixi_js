"use strict";

//USE https://mycurvefit.com/ to get curve functions

/*

12 basic principles of animation 
================================
1.Squash and Stretch
2.Anticipation
3.Staging
4.Straight Ahead Action and Pose to Pose (Not used in following code)
5.Follow Through and Overlapping Action
6.Slow In and Slow Out
7.Arc
8.Secondary Action (Not used in following code)
9.Timing (Not used in following code)
10.Exaggeration
11.Solid drawing (Not used in following code)
12.Appeal (Not used in following code)

Ref : https://en.wikipedia.org/wiki/12_basic_principles_of_animation
Ref : https://www.youtube.com/watch?v=uDqjIdI4bF4

*/

document.addEventListener("DOMContentLoaded", init);

//Rendering
var renderer;
var stage;

//LOOP
var tLastFrame = 0;
var tDelta = 0;
var request_Anim_ID;
var isPaused = false;
var isLoaded = false;

//Game
var box_sprite;

var isJumping = true;
var isSquashing = false;
var isSquashReleasing = false;
var isWaiting = false;
var isAnticipating = false;
var isRuning=false;

var isFollowThruScaleAnimation = false;
var isFollowThruRotAnimation=false;
var isClockWiseRot=false;

//Animation
var ticks = 0;
var tickLimit = 100;
var tickFactor;

var box_halfWidth = 64;
var boxInit_X = -100;//intial box x
var boxInit_Y = 704;////intial box y

var jumpMax_Y = 500;//in pixels
var jumpMax_X = 500;//in pixels

var squashDeltaMax_X = 0.5;
var squashDeltaMax_Y = 0.5;

var MaxRunDistance = 300;//in pixels
var run_expandDeltaMax_X=0.5;
var anticipation_squashDeltaMax_X=0.5;

function init() {

    console.log(PIXI);

    renderer = PIXI.autoDetectRenderer(576, 1024, { antialis: false, transparent: false, resolution: 1, backgroundColor: 0x00001f });
    renderer.autoResize = true;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;

    stage = new PIXI.Container();

    renderer.render(stage);

    document.body.appendChild(renderer.view);

    window.onresize = resize;
    
    document.addEventListener("visibilitychange", onVisibilityChanged, false);
    document.addEventListener("mozvisibilitychange", onVisibilityChanged, false);
    document.addEventListener("webkitvisibilitychange", onVisibilityChanged, false);
    document.addEventListener("msvisibilitychange", onVisibilityChanged, false);

    resize();

    //Load Assets
    PIXI.loader
        .add([
            "images/intro.png",
            "images/Sprite_Sheet.png",
        ])
        .on("progress", loadHandler)
        .on('complete', loadComplete)
        .load(setup);

    var graphics = new PIXI.Graphics();

    stage.addChild(graphics);

    var LoadingIconTex;
    var LoadingIconSprite;

    function loadHandler(loader, res) {

        resize();

        if (res.url === 'images/intro.png') {

            LoadingIconTex = PIXI.loader.resources['images/intro.png'].texture;
            LoadingIconSprite = new PIXI.Sprite(LoadingIconTex);
            LoadingIconSprite.y = 150;
            LoadingIconSprite.x = 188;

            stage.addChild(LoadingIconSprite);

        }

        graphics.clear();

        graphics.beginFill(0x3333ff, 1);

        graphics.drawRect(163, 400, loader.progress * 2.5, 10);

        graphics.endFill();

        graphics.beginFill(0x3333ff, 0);

        graphics.lineStyle(2, 0xffffff, 1);

        graphics.drawRect(163, 400, 250, 10);

        graphics.endFill();

    }

    function loadComplete(loader, res) {

        stage.removeChild(graphics);
        stage.removeChild(LoadingIconSprite);
        //Keep for GC to clean !!!

    }

    function setup() {


        tickFactor = 1 / tickLimit;

        //bg    
        var sprite_atlas = PIXI.loader.resources["images/Sprite_Sheet.png"].texture;

        var bg_tex = new PIXI.Texture(sprite_atlas);
        bg_tex.frame = new PIXI.Rectangle(0, 0, 576, 1024);
        var bg_sprite = new PIXI.Sprite(bg_tex);

        //box
        var box_tex = new PIXI.Texture(sprite_atlas);
        box_tex.frame = new PIXI.Rectangle(640, 64, 128, 128);
        box_sprite = new PIXI.Sprite(box_tex);

        box_sprite.anchor.set(0.5, 1);
        box_sprite.position.set(boxInit_X, boxInit_Y);

        stage.addChild(bg_sprite);
        stage.addChild(box_sprite);

        resize();
        isLoaded = true;

    }

    tLastFrame = performance.now();
    game_update(tLastFrame);

}

//UTIL================

function onVisibilityChanged() {
    if (document.hidden || document.mozHidden || document.webkitHidden || document.msHidden) {
        onAppPause(false);
    }
    else {
        onAppPause(true);
    }
}

function resize() {

    var w = 0;
    var h = 0;
    var ratio = 9 / 16;

    var y = 0;
    var x = 0;

    if (window.innerWidth > window.innerHeight * ratio) {
        w = window.innerHeight * ratio;
        h = window.innerHeight;

        x = (window.innerWidth - w) * 0.5;


    } else {
        w = window.innerWidth;
        h = window.innerWidth / ratio;

        y = (window.innerHeight - h) * 0.5;

    }

    renderer.view.style.width = w + 'px';
    renderer.view.style.height = h + 'px';

    renderer.view.style.margin = y + "px " + x + "px";

}

function onAppPause(status) {

    if (status) {

        if (isPaused) {
            tLastFrame = performance.now();
            game_update(tLastFrame);
            isPaused = false;
        }

    }
    else if (request_Anim_ID) {

        if (!isPaused) {
            cancelAnimationFrame(request_Anim_ID);
            isPaused = true;
        }

    }

}

//===========================

function game_update(tFrame) {

    tDelta = tFrame - tLastFrame;
    request_Anim_ID = requestAnimationFrame(game_update);

    if (isLoaded) {

        //Following is a simple STATE MACHINE

        //Jump [7.Arc]
        if (isJumping) {

            ticks++;

            var step_val = ticks * tickFactor;

            box_sprite.x = boxInit_X + step_val * jumpMax_X;

            step_val = 4 * step_val - 4 * step_val * step_val;

            box_sprite.y = boxInit_Y - step_val * jumpMax_Y;

            if (ticks === tickLimit) {

                boxInit_X = boxInit_X + jumpMax_X;

                box_sprite.x = boxInit_X;// + jumpMax_X;
                box_sprite.y = boxInit_Y;

                ticks = 0;
                tickLimit = 10;
                tickFactor = 1 / tickLimit;

                isJumping = false;
                isSquashing = true;
                
            }

        }
        //[1.Squash and Stretch] 0 
        else if (isSquashing) {

            ticks++;

            var step_val = ticks * tickFactor;

            //Smooth step function [6.Slow In and Slow Out]
            step_val = 3 * step_val * step_val - 2 * step_val * step_val * step_val;

            box_sprite.scale.set(1 + step_val * squashDeltaMax_X, 1 - step_val * squashDeltaMax_Y);

            if (ticks === tickLimit) {

                box_sprite.scale.set(1 + squashDeltaMax_X, 1 - squashDeltaMax_Y);

                ticks = 0;
                tickLimit = 10;
                tickFactor = 1 / tickLimit;

                isSquashing = false;
                isSquashReleasing = true;
            }


        }
        //[1.Squash and Stretch] 1
        else if (isSquashReleasing) {

            ticks++;

            var step_val = ticks * tickFactor;

            //Smooth step function [6.Slow In and Slow Out]
            step_val = 3 * step_val * step_val - 2 * step_val * step_val * step_val;

            box_sprite.scale.set(1 + squashDeltaMax_X - (squashDeltaMax_X * step_val), 1 - squashDeltaMax_X + (squashDeltaMax_X * step_val));

            if (ticks === tickLimit) {

                box_sprite.scale.set(1, 1);

                ticks = 0;
                tickLimit = 25;

                isSquashReleasing = false;
                isWaiting = true;
            }


        }
        //[3.Staging]
        else if (isWaiting) {

            ticks++;

            if (ticks === tickLimit) {

                ticks = 0;
                tickLimit = 25;
                tickFactor = 1 / tickLimit;


                boxInit_X = box_sprite.x;

                isWaiting = false;
                isAnticipating = true;
                
            }


        }
        //[2.Anticipation]
        else if (isAnticipating) {

            ticks++;

            var step_val = ticks * tickFactor;

            step_val = step_val * step_val;

            box_sprite.scale.set(1 - step_val * anticipation_squashDeltaMax_X, 1);
            box_sprite.x=boxInit_X+(anticipation_squashDeltaMax_X*step_val*box_halfWidth);
            
            if (ticks === tickLimit) {

                box_sprite.scale.set(1 - anticipation_squashDeltaMax_X, 1);
                box_sprite.x=boxInit_X+anticipation_squashDeltaMax_X*box_halfWidth;

                ticks = 0;
                tickLimit = 10;
                tickFactor = 1 / tickLimit;

                boxInit_X = box_sprite.x;

                isAnticipating = false;
                isRuning=true;
            }

        }
        //Run [6.Slow In and Slow Out]
        else if (isRuning) {

            ticks++;

            var step_val = ticks * tickFactor;

            //Smooth step function [6.Slow In and Slow Out]
            step_val = 3 * step_val * step_val - 2 * step_val * step_val * step_val;

            //[10.Exaggeration]
            box_sprite.scale.set((1 - anticipation_squashDeltaMax_X)+(anticipation_squashDeltaMax_X+run_expandDeltaMax_X)*step_val, 1);

            box_sprite.x=boxInit_X-step_val*MaxRunDistance + (anticipation_squashDeltaMax_X*(1-step_val))+run_expandDeltaMax_X*step_val;
            
            if (ticks === tickLimit) {

                box_sprite.scale.set(1+run_expandDeltaMax_X, 1);

                box_sprite.x=boxInit_X-MaxRunDistance +run_expandDeltaMax_X;
            
                boxInit_X=box_sprite.x;

                ticks = 0;
                tickLimit = 5;
                tickFactor = 1 / tickLimit;

                isRuning = false;
                isFollowThruScaleAnimation = true;

            }

        }
       //Scale animation [5.Follow Through and Overlapping Action]
       else if (isFollowThruScaleAnimation) {

        ticks++;

        var step_val = ticks * tickFactor;

        //Smooth step function [6.Slow In and Slow Out]
        step_val = 3 * step_val * step_val - 2 * step_val * step_val * step_val;

        box_sprite.scale.set(1+run_expandDeltaMax_X - run_expandDeltaMax_X*step_val, 1);
        box_sprite.x=boxInit_X+(run_expandDeltaMax_X*step_val);

        if (ticks === tickLimit) {

            box_sprite.scale.set(1, 1);
            box_sprite.x=boxInit_X+run_expandDeltaMax_X;
            
            boxInit_X=box_sprite.x;

            ticks = 0;
            tickLimit = 5;
            tickFactor = 1 / tickLimit;
            
            isFollowThruScaleAnimation = false;
            isFollowThruRotAnimation=true;

        }

    }
    //Rotation animation [5.Follow Through and Overlapping Action]
    else if (isFollowThruRotAnimation) {

        if(!isClockWiseRot&&ticks==0){
            box_sprite.anchor.set(0,1);
            box_sprite.x-=box_halfWidth;
        }

        ticks++;
   
        var step_val = ticks * tickFactor;

        //Smooth step function [6.Slow In and Slow Out]
        step_val = 3 * step_val * step_val - 2 * step_val * step_val * step_val;
        
        box_sprite.rotation = (isClockWiseRot?-0.5*(1-step_val):(-0.5*step_val));

        if (ticks === tickLimit) {

            box_sprite.rotation = (isClockWiseRot?0:-0.5);
            ticks=0;
            isClockWiseRot=!isClockWiseRot;
            isFollowThruRotAnimation = isClockWiseRot;
            
        }

    }

    }

    tLastFrame = tFrame;
    renderer.render(stage);

}
