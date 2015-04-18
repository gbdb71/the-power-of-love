function tick_game(game) {
    // XXX: most force and acceleration values are not tick_fps compensated...

    var nearest_people_distance = game.cursor.max_select_distance;
    var nearest_people = null;
    for (var i = 0; i < game.peoples.list.length; ++i) {
        var people = game.peoples.list[i];

        // TODO: correct constant acceleration equation
        // TODO: continuous collision detection

        if (people.state == 'falling') {
            people.dy += game.peoples.gravity / game.tick_fps;
            people.dy *= 1 - game.peoples.falling_friction.y;
            people.dx *= 1 - game.peoples.falling_friction.x;
        }

        people.previous_dx = people.dx;
        people.previous_dy = people.dy;
        people.x += people.dx;
        people.y += people.dy;

        switch (people.state) {
            case 'falling':
                var people_top = people.y - game.peoples.radius;
                var people_bottom = people.y + game.peoples.radius;
                for (var j = 0; j < game.platforms.list.length; ++j) {
                    var platform = game.platforms.list[j];
                    if (people.x >= platform.x_min && people.x < platform.x_max && people_bottom >= platform.y && people_top <= platform.y) {
                        people.dx = (people.orientation == 'left' ? -1 : 1) * game.peoples.walk_velocity;
                        people.dy = 0;
                        people.y = platform.y - game.peoples.radius;
                        people.state = 'walking';
                        people.platform = platform;
                        break;
                    }
                }
                break;
            case 'walking':
                if (people.x < people.platform.x_min || people.x >= people.platform.x_max) {
                    people.orientation = people.orientation == 'left' ? 'right' : 'left';
                    people.dx = (people.orientation == 'left' ? -1 : 1) * game.peoples.walk_velocity;
                }
                break;
        }

        var people_distance = distance(people, game.cursor.position);
        if (people_distance < nearest_people_distance) {
            nearest_people_distance = people_distance;
            nearest_people = people;
        }
    }

    game.cursor.selected_people = nearest_people;

    for (i = 0; i < game.arrows.list.length; ++i) {
        var arrow = game.arrows.list[i];
        switch (arrow.state) {
            case 'flying':
                arrow.z += game.arrows.z_velocity;
                arrow.x += arrow.dx;
                arrow.y += arrow.dy;
                arrow.dy += game.arrows.gravity;
                if (arrow.target && arrow.z <= game.arrows.far) {
                    var dx = arrow.target.x - arrow.x + arrow.target.dx * game.arrows.prediction_force;
                    var dy = arrow.target.y - arrow.y + arrow.target.dy * game.arrows.prediction_force;
                    arrow.dx += game.arrows.tracking_force * dx;
                    arrow.dy += game.arrows.tracking_force * dy;
                    arrow.dx *= 1 - game.arrows.xy_friction;
                    arrow.dy *= 1 - game.arrows.xy_friction;
                }
                if (arrow.z >= game.arrows.far && arrow.z < game.arrows.far + game.arrows.z_velocity * 2) {
                    if (arrow.target && distance(arrow, arrow.target) < game.peoples.radius + game.arrows.radius) {
                        arrow.state = 'attached';
                        arrow.z = game.arrows.far;
                    }
                    //else
                    //    arrow.state = 'stuck';
                }

                if (distance(arrow, arrow.trail[0]) > 5) {
                    arrow.trail.unshift({x: arrow.x, y: arrow.y, z: arrow.z, state: 'tracking'});
                    arrow.trail.splice(10, 1);
                }
                break;
            case 'attached':
                arrow.x += arrow.target.previous_dx;
                arrow.y += arrow.target.previous_dy;
                break;
            case 'stuck':
                break;
        }

        var previous = arrow;
        for (j = 0; j < arrow.trail.length; ++j) {
            var trail = arrow.trail[j];
            if (trail.state == 'tracking') {
                trail.x += (previous.x - trail.x) * 0.5;
                trail.y += (previous.y - trail.y) * 0.5;
                trail.z += (previous.z - trail.z) * 0.5;
                trail.y += 0.1;
                if (arrow.state != 'flying' && distance(previous, trail) + (Math.abs(trail.z - previous.z) * 200) < 3)
                    trail.state = 'locked';
            } else {
                trail.x += arrow.target.previous_dx;
                trail.y += arrow.target.previous_dy;
            }
            previous = trail;
        }

        if (arrow.z > game.arrows.far * 4) {
            game.arrows.list.splice(i, 1);
            --i;
        }
    }

    if (game.cursor.just_released) {
        var z_factor = game.arrows.z_velocity / (game.arrows.far - game.arrows.near);
        game.arrows.list.push({
            state: 'flying',
            x: game.width * 0.5,
            y: game.height * 0.5,
            z: game.arrows.near,
            dx: (game.cursor.position.x - game.width * 0.5) * z_factor,
            dy: (game.cursor.position.y - game.height * 0.5 - game.arrows.gravity_compensation) * z_factor,
            target: game.cursor.selected_people,
            trail: [{x: game.width * 0.5, y: game.height * 0.5, z: game.arrows.near, state: 'tracking'}]
        });
    }

    game.cursor.just_pressed = false;
    game.cursor.just_released = false;
}