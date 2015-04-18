function draw_game(game, context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = game.background_color;
    context.fillRect(0, 0, game.width + 1, game.height + 1);

    if (game.cursor.selected_people) {
        var selected_people = game.cursor.selected_people;
        context.fillStyle = game.peoples.colors.fov;
        context.beginPath();
        context.moveTo(selected_people.x, selected_people.y);
        var angle_offset = selected_people.orientation == 'left' ? Math.PI : 0;
        context.arc(selected_people.x, selected_people.y, game.peoples.fov_radius,
            angle_offset + game.peoples.fov_angle * -0.5, angle_offset + game.peoples.fov_angle * 0.5);
        context.fill();
        context.fillStyle = game.peoples.colors.selected;
        context.beginPath();
        context.arc(selected_people.x, selected_people.y, game.peoples.radius + game.peoples.select_radius, 0, 2 * Math.PI);
        context.fill();
    }

    draw_arrows(game, context, 'back');

    context.fillStyle = game.platforms.background_color;
    for (var i = 0; i < game.platforms.list.length; ++i) {
        var platform = game.platforms.list[i];
        context.fillRect(platform.x_min, platform.y, platform.x_max - platform.x_min, game.platforms.height);
    }

    for (i = 0; i < game.peoples.list.length; ++i) {
        var people = game.peoples.list[i];
        context.fillStyle = game.peoples.colors[people.state];
        context.beginPath();
        context.arc(people.x, people.y, game.peoples.radius, 0, 2 * Math.PI);
        context.fill();
    }

    draw_arrows(game, context, 'front');

    context.fillStyle = game.cursor.color;
    context.fillRect(game.cursor.position.x - game.cursor.radius, game.cursor.position.y, game.cursor.radius * 2 + 1, 1);
    context.fillRect(game.cursor.position.x, game.cursor.position.y - game.cursor.radius, 1, game.cursor.radius * 2 + 1);
}

function draw_arrows(game, context, layer) {

    function draw_arrow_part(position) {
        if (layer == 'back' ^ position.z < game.arrows.far) {
            var z_factor = 1 / unlerp(position.z, game.arrows.near, game.arrows.far);
            var x = (position.x - game.width * 0.5) * z_factor + game.width * 0.5;
            var y = (position.y - game.height * 0.5) * z_factor + game.height * 0.5;
            context.moveTo(x, y);
            context.arc(x, y, game.arrows.radius * z_factor, 0, 2 * Math.PI);
        }
    }

    for (i = 0; i < game.arrows.list.length; ++i) {
        var arrow = game.arrows.list[i];
        if (layer == 'front')
            context.fillStyle = 'rgba(0, 0, 0, ' + Math.max(0, unlerp(arrow.z, game.arrows.near, game.arrows.far) - 0.02) + ')';
        else
            context.fillStyle = 'rgba(0, 0, 0, ' + unlerp(arrow.z, game.arrows.far * 4, game.arrows.far) + ')';
        context.beginPath();
        var previous = arrow;
        for (var j = 0; j < arrow.trail.length; ++j) {
            var trail = arrow.trail[j];
            for (var k = 0; k < 1; k += arrow.z * 0.3)
                draw_arrow_part({
                    x: lerp(k, trail.x, previous.x),
                    y: lerp(k, trail.y, previous.y),
                    z: lerp(k, trail.z, previous.z)
                });
            previous = trail;
        }
        draw_arrow_part(arrow);
        context.fill();
    }

}