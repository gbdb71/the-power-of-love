function init_game(game, canvas) {
    canvas.setAttribute("width", game.width);
    canvas.setAttribute("height", game.height);
    var context = canvas.getContext("2d");

    game.current_level = 0;
    init_level(game, game.levels[game.current_level]);

    (function draw_loop() {
        draw_game(game, context);
        requestAnimationFrame(draw_loop, canvas);
    })();

    setInterval(function () {
        tick_game(game);
    }, 1000 / game.tick_fps);

    canvas.addEventListener('mousemove', function (event) {
        var x = event.offsetX !== undefined ? event.offsetX : event.layerX;
        var y = event.offsetY !== undefined ? event.offsetY : event.layerY;
        game.cursor.position.x = x;
        game.cursor.position.y = y;
    });

    canvas.addEventListener('mousedown', function (event) {
        if (event.button == 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            game.cursor.just_pressed = true;
            game.cursor.pressed = true;
        }
    });

    canvas.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    document.addEventListener('mouseup', function (event) {
        if (event.button == 0) {
            game.cursor.just_released = true;
            game.cursor.pressed = false;
        }
    });

    canvas.className += ' loaded';
}

function init_level(game, level) {
    game.state = 'playing';
    game.multiplier = 1;
    game.score = 0;
    game.smooth_score = 0;
    game.retry_hover = 0;
    game.next_hover = 0;
    game.timeout_start_time = game.time;
    game.smooth_timeout_start_time = game.timeout_start_time;
    game.is_timeouting = false;
    game.level_time = game.time;
    game.platforms.list = [];
    for (var i = 0; i < level.platforms.length; ++i) {
        var platform = level.platforms[i];
        var points_count = Math.max(3, Math.floor((platform.x_max - platform.x_min) / 40));
        var points = [];
        var points_2 = [];
        var points_3 = [];
        for (var j=0; j<points_count - 1; ++j) {
            points.push({
                x: platform.x_min + (platform.x_max - platform.x_min) / (points_count - 1) * (j + 0.5) + (Math.random() - 0.5) * 10,
                y: platform.y + (Math.random() * 0.5 + 0.5) * game.platforms.height});
        }
        for (j=0; j<points_count; ++j) {
            points_2.push({
                x: platform.x_min + (platform.x_max - platform.x_min) / (points_count) * (j + 0.5)+ (Math.random() - 0.5) * 10,
                y: platform.y + (Math.random() * 0.3 + 0.7) * game.platforms.height * 2});
        }

        for (j=0; j<points_count; ++j) {
            points_3.push({
                x: platform.x_min + (platform.x_max - platform.x_min) / (points_count) * (j + 0.5)+ (Math.random() - 0.5) * 10,
                y: platform.y - (Math.random() * 0.7 + 0.3) * game.platforms.height * 0.5});
        }
        game.platforms.list.push({
            y: platform.y,
            x_min: platform.x_min,
            x_max: platform.x_max,
            jumpers: platform.jumpers.slice(0),
            points: points,
            points_2: points_2,
            points_3: points_3
        });
    }
    game.peoples.list = [];
    for (i = 0; i < level.peoples.length; ++i) {
        var people = level.peoples[i];
        game.peoples.list.push({
            movement_state: 'falling',
            state: 'wandering',
            mate: null,
            orientation: people.orientation,
            previous_dx: 0,
            previous_dy: 0,
            dx: 0,
            dy: 0,
            x: people.x,
            y: people.y,
            platform: null,
            fov_radius: 0,
            fov_center: people.orientation == 'left' ? Math.PI : Math.PI * 2,
            fov_center_velocity: 0
        });
    }
    game.arrows.list = [];
}