function draw_game(game, context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = game.background_color + Math.min(game.time * 20, 1) + ')';
    context.fillRect(0, 0, game.width, game.height);

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

    for (i = 0; i < game.messages.list.length; ++i) {
        var message = game.messages.list[i];
        animation = unlerp(game.time - message.time, 0, 0.5);
        if (animation <= 1 && message.initial_x) {
            context.fillStyle = 'rgba(255, 255, 255, ' + (1 - animation) + ')';
            context.beginPath();
            context.arc(message.initial_x, message.initial_y, animation * 300, 0, Math.PI * 2);
            context.fill();
        }
    }

    for (i = 0; i < game.peoples.list.length; ++i) {
        people = game.peoples.list[i];
        if (people.state == 'selecting_mate') {
            var start_angle = people.fov_center + game.peoples.fov_angle * -0.5;
            var stop_angle = people.fov_center + game.peoples.fov_angle * 0.5;
            var gradient = context.createRadialGradient(people.x, people.y, 0, people.x, people.y, people.fov_radius);
            gradient.addColorStop(0, 'rgba(228, 168, 218, 0.4)');
            gradient.addColorStop(1, 'rgba(228, 168, 218, 0)');
            context.fillStyle = gradient;
            context.beginPath();
            context.moveTo(people.x, people.y);
            context.arc(people.x, people.y, people.fov_radius, start_angle, stop_angle);
            context.fill();
        } else if (people.state == 'following_mate' && people.movement_state != 'ascending') {
            animation = Math.min(unlerp(game.time - people.mate_time, 0, 0.5), 1);
            var mate_distance = distance(people, people.mate);
            var angle_center = lerp(animation, people.fov_center, people.target_fov_center);
            start_angle = angle_center + lerp(animation, game.peoples.fov_angle, 0.05) * -0.5;
            stop_angle = angle_center + lerp(animation, game.peoples.fov_angle, 0.05) * 0.5;
            gradient = context.createRadialGradient(people.x, people.y, 0, people.x, people.y, people.fov_radius);
            gradient.addColorStop(0, 'rgba(228, 168, 218, ' + lerp(animation, 0.4, 0.8) + ')');
            gradient.addColorStop(1, 'rgba(228, 168, 218, ' + lerp(animation, 0, 0.4) + ')');
            context.fillStyle = gradient;
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

    if (game.state != 'score')
        draw_arrows(game, context, 'back');

    var fader = Math.min((game.time - game.level_time) * 6, 1);

    for (i = 0; i < game.platforms.list.length; ++i) {
        var platform = game.platforms.list[i];

        gradient = context.createLinearGradient(0, platform.y, 0, platform.y + 300);
        gradient.addColorStop(0, 'rgba(20, 0, 40, ' + 0.1 * fader + ')');
        gradient.addColorStop(1, 'rgba(20, 0, 40, 0.0)');

        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(platform.x_min, platform.y);
        context.lineTo(platform.x_min - 200, platform.y + 400);
        context.lineTo(platform.x_max - 200, platform.y + 400);
        context.lineTo(platform.x_max, platform.y);
        context.fill();
    }

    for (i = 0; i < game.platforms.list.length; ++i) {
        platform = game.platforms.list[i];

        context.fillStyle = 'rgba(135, 75, 63,' + 1.0 + ')';
        context.beginPath();
        context.moveTo(platform.x_min, platform.y);
        for (j = 0; j < platform.points_2.length; ++j) {
            var point = platform.points_2[j];
            context.lineTo(point.x, point.y);
        }
        context.lineTo(platform.x_max, platform.y);
        context.fill();

        context.fillStyle = 'rgba(164, 80, 64,' + 1.0 + ')';
        context.beginPath();
        context.moveTo(platform.x_min, platform.y);
        for (j = 0; j < platform.points.length; ++j) {
            point = platform.points[j];
            var point_2 = platform.points_2[j];
            context.lineTo(point_2.x, point_2.y);
            context.lineTo(point.x, point.y);
        }
        context.lineTo(platform.points_2[j].x, platform.points_2[j].y);
        context.lineTo(platform.x_max, platform.y);
        context.fill();

        context.fillStyle = 'rgba(174, 110, 54,' + 1.0 + ')';
        context.beginPath();
        context.moveTo(platform.x_min, platform.y);
        for (j = 0; j < platform.points.length; ++j) {
            point = platform.points[j];
            context.lineTo(point.x, point.y);
        }
        context.lineTo(platform.x_max, platform.y);
        for (j = 0; j < platform.points_3.length; ++j) {
            point = platform.points_3[platform.points_3.length - j - 1];
            context.lineTo(point.x, point.y);
        }
        context.fill();


        context.fillStyle = '#e44';
        for (j = 0; j < platform.jumpers.length; ++j) {
            var start = platform.jumpers[j] - game.platforms.jumper_width * 0.7;
            var end = platform.jumpers[j] + game.platforms.jumper_width * 0.7;
            context.beginPath();
            context.moveTo(start, platform.y + 4);
            context.lineTo(start + (end - start) / 3, platform.y + 8);
            context.lineTo(start + (end - start) / 3 * 2, platform.y + 8);
            context.lineTo(end, platform.y + 4);
            context.lineTo(end, platform.y);
            context.lineTo(start + (end - start) / 3 * 2, platform.y - 2);
            context.lineTo(start + (end - start) / 3, platform.y - 2);
            context.lineTo(start, platform.y);
            context.fill();
        }
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

    if (game.state != 'score')
        draw_arrows(game, context, 'front');

    context.font = "30px " + game.font;
    context.fillStyle = 'rgba(0, 0, 0,' + Math.max(Math.min(game.time - 1, 1), 0) + ')';
    context.textAlign = 'left';
    context.fillText("Score: " + Math.round(game.smooth_score), 20, 34);

    if (game.multiplier > 1) {
        context.font = "30px " + game.font;
        context.fillStyle = '#000';
        context.textAlign = 'right';
        context.fillText("Bonus: x" + game.multiplier, game.width - 20, 34);
    }

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    var text_position = 60;
    for (i = 0; i < game.messages.list.length; ++i) {
        message = game.messages.list[i];
        var target_x = game.width * 0.5;
        var target_y = text_position;
        if (message.dx == undefined) {
            message.dx = 0;
            message.dy = 0;
            message.initial_x = message.x;
            message.initial_y = message.y;
        }
        var increment = 30;
        var color1, color2;
        if (game.time - message.time < 3) {
            var fade_in = Math.min(unlerp(game.time - message.time, 0, 0.5), 1);
            context.font = (40 * fade_in) + "px " + game.font;
            context.fillStyle = 'rgba(220, 120, 120, ' + (fade_in - Math.max(fade_in - 0.666, 0) * 3) + ')';
            context.fillText((message.score > 0 ? '+' : '') + message.score, message.initial_x, message.initial_y - 50 * fade_in);
            context.font = lerp(fade_in, 70, 30) + "px " + game.font;
            color1 = 'rgba(255, 255, 255,' + fade_in + ')';
            color2 = (message.score < 0 ? 'rgba(200, 20, 20,' : 'rgba(233, 119, 141,') + fade_in + ')';
        } else {
            var fade_out = Math.min(unlerp(game.time - (message.time + 3), 0, 0.5), 1);
            if (fade_out == 1) {
                game.messages.list.splice(i, 1);
                --i;
                continue;
            }
            context.font = lerp(fade_out, 30, 0) + "px " + game.font;
            color1 = 'rgba(255, 255, 255,' + fade_out + ')';
            color2 = (message.score < 0 ? 'rgba(200, 20, 20,' : 'rgba(233, 119, 141,') + (1 - fade_out) + ')';
            increment = lerp(fade_out, 30, 0);
        }

        // TODO: fix this and move to tick function
        message.dx += 0.03 * (target_x - message.x) + 0.0000003 * (target_x - message.x) * (target_x - message.x) * (target_x - message.x);
        message.dy += 0.03 * (target_y - message.y) + 0.0000003 * (target_y - message.y) * (target_y - message.y) * (target_y - message.y);
        message.dx *= 0.82;
        message.dy *= 0.82;
        message.x += message.dx;
        message.y += message.dy;
        context.fillStyle = color1;
        context.fillText((message.score > 0 ? '+' : '') + message.score + ': ' + message.text, message.x + 1, message.y + 1, game.width);
        context.fillStyle = color2;
        context.fillText((message.score > 0 ? '+' : '') + message.score + ': ' + message.text, message.x, message.y, game.width);
        text_position += increment;
    }
    context.textBaseline = 'alphabetic';


    var timeout_ratio = Math.min(1, Math.max(0, (game.time - game.smooth_timeout_start_time - game.timeout_length * 0.5) / (game.timeout_length * 0.5)));
    if (timeout_ratio > 0) {
        context.fillStyle = game.background_color + Math.min(timeout_ratio + 5, 1) + ')';
        var center_x = game.width * 0.5;
        var center_y = game.height * 0.5;
        var size = 280 * (1 - timeout_ratio);
        var lineWidth = 10;
        context.beginPath();
        context.moveTo(-lineWidth, -lineWidth);
        context.lineTo(-lineWidth, game.height + lineWidth);
        context.lineTo(game.width + lineWidth, game.height + lineWidth);
        context.lineTo(game.width + lineWidth, -lineWidth);
        context.closePath();
        if (timeout_ratio < 1) {
            context.moveTo(center_x, center_y - size * 0.75);
            context.arc(center_x + size, center_y - size * 0.75, size, -Math.PI, Math.PI / 5);
            context.lineTo(center_x, center_y + size * 2.25);
            context.arc(center_x - size, center_y - size * 0.75, size, Math.PI - Math.PI / 5, 0);
            context.closePath();
        }
        context.strokeStyle = '#fff';
        context.lineJoin = 'round';
        context.lineWidth = lineWidth;
        context.stroke();
        context.fill();
    }

    if (game.state == 'score') {
        fade_in = Math.min(( game.time - game.score_time) * 5, 1);

        draw_arrows(game, context, 'back');

        context.font = "60px " + game.font;
        context.fillStyle = 'rgba(0, 0, 0,' + fade_in + ')';
        context.textAlign = 'center';
        context.fillText("Score: " + game.score, game.width * 0.5, game.height * 0.3);

        context.fillStyle = 'rgba(100, 50, 75, ' + (0.85 * fade_in) + ')';
        context.beginPath();
        context.arc(game.width * 0.33, game.height * 0.60 - game.retry_hover * 10, 40, 0, 2 * Math.PI);
        context.fill();

        context.fillStyle = 'rgba(100, 50, 75, ' + (0.85 * fade_in * game.retry_hover) + ')';
        context.textAlign = 'center';
        context.font = "26px " + game.font;
        context.fillText("Retry", game.width * 0.33, game.height * 0.60 + game.retry_hover * 10 + 44);

        context.fillStyle = 'rgba(221, 85, 136, ' + ((game.score > 0 ? 0.85 : 0.05) * fade_in) + ')';
        context.beginPath();
        var x = game.width * 0.66;
        var y = game.height * 0.60 - game.next_hover * 10;
        if (game.current_level == game.levels.length - 1) {
            context.moveTo(x + 20, y - 40);
            context.lineTo(x - 44, y);
            context.lineTo(x + 20, y + 40);
            context.moveTo(x + 40, y - 40);
            context.lineTo(x - 24, y);
            context.lineTo(x + 40, y + 40);
        } else {
            context.moveTo(x - 30, y - 40);
            context.lineTo(x + 34, y);
            context.lineTo(x - 30, y + 40);
        }
        context.fill();

        if (game.score > 0) {
            context.fillStyle = 'rgba(221, 85, 136, ' + (0.85 * fade_in * game.next_hover) + ')';
            context.textAlign = 'center';
            context.font = "26px " + game.font;
            context.fillText(game.current_level == game.levels.length - 1 ? "Restart" : "Next", game.width * 0.66, game.height * 0.60 + game.next_hover * 10 + 44);
        }

        draw_arrows(game, context, 'front');
    }

    center_x = game.cursor.position.x;
    center_y = game.cursor.position.y;
    size = 10;

    context.beginPath();
    context.moveTo(center_x, center_y - size);
    context.arc(center_x + size, center_y - size, size, -Math.PI, Math.PI / 5);
    context.lineTo(center_x, center_y + size * 2);
    context.arc(center_x - size, center_y - size, size, Math.PI - Math.PI / 5, 0);
    context.closePath();
    context.moveTo(center_x - 6, center_y - 6);
    context.lineTo(center_x + 6, center_y + 6);
    context.moveTo(center_x + 6, center_y - 6);
    context.lineTo(center_x - 6, center_y + 6);
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 4;
    context.stroke();
    context.strokeStyle = 'rgba(221, 85, 136, 1)';
    context.lineWidth = 2;
    context.stroke();
}

function draw_arrows(game, context, layer) {

    function draw_arrow_head(arrow) {

        context.fillStyle = 'rgba(221, 85, 136,' + Math.min(Math.max(0, unlerp(arrow.z, game.arrows.near, game.arrows.far) + 0.2) * 1.2, 1) + ')';
        context.beginPath();
        var x = arrow.x;
        var y = arrow.y;
        var z = arrow.z;
        var radius = 1.5 * game.arrows.radius;
        for (var i = 0; i < 1; i += 0.1) {
            draw_arrow_part(radius, {x: x, y: y, z: z});
            x += arrow.dx * 0.1;
            y += arrow.dy * 0.1;
            z += game.arrows.z_velocity * 0.1;
            radius -= 0.15;
        }
        context.fill();
    }

    function draw_arrow_part(radius, position, with_fins) {
        var rotation = arrow.z * 2 + game.time;
        if (layer == 'back' ^ position.z < game.arrows.far) {
            var z_factor = 1 / unlerp(position.z, game.arrows.near, game.arrows.far);
            var x = (position.x - game.width * 0.5) * z_factor + game.width * 0.5;
            var y = (position.y - game.height * 0.5) * z_factor + game.height * 0.5;
            context.moveTo(x, y);
            context.arc(x, y, radius * z_factor, 0, 2 * Math.PI);
            if (with_fins) {
                context.moveTo(x + Math.cos(rotation + -0.05) * radius * z_factor, y + Math.sin(rotation + -0.05) * radius * z_factor);
                context.lineTo(x + Math.cos(rotation + 0) * radius * z_factor * 2.5, y + Math.sin(rotation + 0) * radius * z_factor * 2.5);
                context.lineTo(x + Math.cos(rotation + 0.05) * radius * z_factor, y + Math.sin(rotation + 0.05) * radius * z_factor);
                context.moveTo(x + Math.cos(rotation + -0.05 + Math.PI * 2 / 3) * radius * z_factor, y + Math.sin(rotation + -0.05 + Math.PI * 2 / 3) * radius * z_factor);
                context.lineTo(x + Math.cos(rotation + Math.PI * 2 / 3) * radius * z_factor * 2.5, y + Math.sin(rotation + Math.PI * 2 / 3) * radius * z_factor * 2.5);
                context.lineTo(x + Math.cos(rotation + 0.05 + Math.PI * 2 / 3) * radius * z_factor, y + Math.sin(rotation + 0.05 + Math.PI * 2 / 3) * radius * z_factor);
                context.moveTo(x + Math.cos(rotation + -0.05 + Math.PI * 4 / 3) * radius * z_factor, y + Math.sin(rotation + -0.05 + Math.PI * 4 / 3) * radius * z_factor);
                context.lineTo(x + Math.cos(rotation + Math.PI * 4 / 3) * radius * z_factor * 2.5, y + Math.sin(rotation + Math.PI * 4 / 3) * radius * z_factor * 2.5);
                context.lineTo(x + Math.cos(rotation + 0.05 + Math.PI * 4 / 3) * radius * z_factor, y + Math.sin(rotation + 0.05 + Math.PI * 4 / 3) * radius * z_factor);
            }
        }
    }

    for (i = 0; i < game.arrows.list.length; ++i) {
        var arrow = game.arrows.list[i];

        if (arrow.state == 'flying')
            draw_arrow_head(arrow);

        var opacity = 1;
        var radius = game.arrows.radius;
        if (arrow.state == 'attached') {
            var animation = Math.min(unlerp(game.time - arrow.attach_time, 0, 0.4), 1);
            radius = lerp(animation, radius, 0);
            opacity = lerp(animation, 1, 0);
        }
        if (layer == 'front')
            context.fillStyle = 'rgba(100, 50, 75, ' + opacity * Math.min(Math.max(0, unlerp(arrow.z, game.arrows.near, game.arrows.far) + 0.2) * 1.2, 1) + ')';
        else
            context.fillStyle = 'rgba(100, 50, 75, ' + opacity * unlerp(arrow.z, game.arrows.far * 4, game.arrows.far) + ')';
        context.beginPath();
        var previous = arrow;
        for (var j = 0; j < arrow.trail.length; ++j) {
            var trail = arrow.trail[j];
            for (var k = 0; k < 1; k += arrow.z * 0.3)
                draw_arrow_part(radius, {
                    x: lerp(k, trail.x, previous.x),
                    y: lerp(k, trail.y, previous.y),
                    z: lerp(k, trail.z, previous.z)
                }, j == arrow.trail.length - 1);
            previous = trail;
        }
        draw_arrow_part(radius, arrow);
        context.fill();

    }
}