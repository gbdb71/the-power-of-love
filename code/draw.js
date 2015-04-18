function draw_game(game, context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = game.background_color;
    context.fillRect(0, 0, game.width + 1, game.height + 1);

    for (var i = 0; i < game.peoples.list.length; ++i) {
        var people = game.peoples.list[i];
        if (people.state == 'selecting_mate' || people.state == 'following_mate') {
            var animation = unlerp(game.time - people.select_time, 0, 0.5);
            if (animation <= 1) {
                context.fillStyle = 'rgba(255, 255, 255, ' + (1 - animation) + ')';
                context.beginPath();
                context.arc(people.x, people.y, animation * 300, 0, Math.PI * 2);
                context.fill();
            }
        }
    }

    for (i = 0; i < game.peoples.list.length; ++i) {
        people = game.peoples.list[i];
        if (people.state == 'selecting_mate') {
            var start_angle = people.fov_center + game.peoples.fov_angle * -0.5;
            var stop_angle = people.fov_center + game.peoples.fov_angle * 0.5;
            context.fillStyle = game.peoples.colors.fov;
            context.beginPath();
            context.moveTo(people.x, people.y);
            context.arc(people.x, people.y, people.fov_radius, start_angle, stop_angle);
            context.fill();
        } else if (people.state == 'following_mate' && people.movement_state != 'ascending') {
            animation = Math.min(unlerp(game.time - people.mate_time, 0, 0.5), 1);
            var mate_distance =distance(people, people.mate);
            var angle_center = lerp(animation, people.fov_center, Math.atan2(people.mate.y - people.y, people.mate.x - people.x));
            start_angle = angle_center + lerp(animation, game.peoples.fov_angle, 0.05) * -0.5;
            stop_angle = angle_center + lerp(animation, game.peoples.fov_angle, 0.05) * 0.5;
            context.fillStyle = game.peoples.colors.fov;
            context.beginPath();
            context.moveTo(people.x, people.y);
            context.arc(people.x, people.y, Math.min(lerp(animation, people.fov_radius, mate_distance), mate_distance), start_angle, stop_angle);
            context.fill();
        }
    }

    if (game.cursor.selected_people) {
        var selected_people = game.cursor.selected_people;
        context.fillStyle = game.peoples.colors.selected;
        context.beginPath();
        context.arc(selected_people.x, selected_people.y, game.peoples.radius + game.peoples.select_radius, 0, 2 * Math.PI);
        context.fill();
    }

    draw_arrows(game, context, 'back');

    context.fillStyle = game.platforms.background_color;
    for (i = 0; i < game.platforms.list.length; ++i) {
        var platform = game.platforms.list[i];
        context.fillRect(platform.x_min, platform.y, platform.x_max - platform.x_min, game.platforms.height);
        for (j = 0; j < platform.jumpers.length; ++j)
            context.fillRect(platform.jumpers[j] - game.platforms.jumper_width * 0.5, platform.y - game.platforms.jumper_height, game.platforms.jumper_width, game.platforms.jumper_height);
    }

    for (i = 0; i < game.peoples.list.length; ++i) {
        people = game.peoples.list[i];
        context.fillStyle = game.peoples.colors[people.movement_state == 'ascending' ? 'ascending' : people.state];
        context.beginPath();
        context.arc(people.x, people.y, game.peoples.radius, 0, 2 * Math.PI);
        context.fill();
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        var dx = Math.cos(people.fov_center);
        var dy = Math.sin(people.fov_center);
        context.beginPath();
        context.arc(people.x + 4 * dx, people.y + 4 * dy, game.peoples.radius * 0.55, 0, 2 * Math.PI);
        context.fill();
    }

    draw_arrows(game, context, 'front');

    context.fillStyle = game.cursor.color;
    context.fillRect(game.cursor.position.x - game.cursor.radius, game.cursor.position.y, game.cursor.radius * 2 + 1, 1);
    context.fillRect(game.cursor.position.x, game.cursor.position.y - game.cursor.radius, 1, game.cursor.radius * 2 + 1);
}

function draw_arrows(game, context, layer) {

    function draw_arrow_part(radius, position) {
        if (layer == 'back' ^ position.z < game.arrows.far) {
            var z_factor = 1 / unlerp(position.z, game.arrows.near, game.arrows.far);
            var x = (position.x - game.width * 0.5) * z_factor + game.width * 0.5;
            var y = (position.y - game.height * 0.5) * z_factor + game.height * 0.5;
            context.moveTo(x, y);
            context.arc(x, y, radius * z_factor, 0, 2 * Math.PI);
        }
    }

    for (i = 0; i < game.arrows.list.length; ++i) {
        var arrow = game.arrows.list[i];

        var opacity = 1;
        var radius = game.arrows.radius;
        if (arrow.state == 'attached') {
            var animation = Math.min(unlerp(game.time - arrow.attach_time, 0, 0.4), 1);
            radius = lerp(animation, radius, 0);
            opacity = lerp(animation, 1, 0);
        }
        if (layer == 'front')
            context.fillStyle = 'rgba(0, 0, 0, ' + opacity * Math.max(0, unlerp(arrow.z, game.arrows.near, game.arrows.far) - 0.02) + ')';
        else
            context.fillStyle = 'rgba(0, 0, 0, ' + opacity * unlerp(arrow.z, game.arrows.far * 4, game.arrows.far) + ')';
        context.beginPath();
        var previous = arrow;
        for (var j = 0; j < arrow.trail.length; ++j) {
            var trail = arrow.trail[j];
            for (var k = 0; k < 1; k += arrow.z * 0.3)
                draw_arrow_part(radius, {
                    x: lerp(k, trail.x, previous.x),
                    y: lerp(k, trail.y, previous.y),
                    z: lerp(k, trail.z, previous.z)
                });
            previous = trail;
        }
        draw_arrow_part(radius, arrow);
        context.fill();
    }

}