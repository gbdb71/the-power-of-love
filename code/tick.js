function tick_game(game) {
    // XXX: most force and acceleration values are not tick_fps compensated...

    var nearest_people_distance = game.cursor.max_select_distance;
    var nearest_people = null;
    for (var i = 0; i < game.peoples.list.length; ++i) {
        var people = game.peoples.list[i];

        if (people.state == 'following_mate' || people.state == 'ascending')
            people.target_fov_center = Math.atan2(people.mate.y - people.y, people.mate.x - people.x);
        else
            people.target_fov_center = Math.atan2(-0.25 * people.dy, people.dx);
        var forward_delta = people.target_fov_center - people.fov_center;
        var backward_delta = -forward_delta;
        if (forward_delta < 0)
            forward_delta += 2 * Math.PI;
        if (backward_delta < 0)
            backward_delta += 2 * Math.PI;
        if (forward_delta < backward_delta) {
            if (people.target_fov_center < people.fov_center)
                people.target_fov_center += 2 * Math.PI;
        } else if (people.target_fov_center > people.fov_center)
            people.target_fov_center -= 2 * Math.PI;
        var delta = people.target_fov_center - people.fov_center;
        people.fov_center_velocity += delta * 0.02;
        people.fov_center_velocity *= 0.85;
        people.fov_center += people.fov_center_velocity;
        if (people.fov_center < 0)
            people.fov_center += 2 * Math.PI;
        else if (people.fov_center >= 2 * Math.PI)
            people.fov_center -= 2 * Math.PI;

        // TODO: correct constant acceleration equation
        // TODO: continuous collision detection

        if (people.movement_state == 'falling') {
            people.dy += game.peoples.gravity / game.tick_fps;
            people.dy *= 1 - game.peoples.falling_friction.y;
            people.dx *= 1 - game.peoples.falling_friction.x;
        }

        people.previous_dx = people.dx;
        people.previous_dy = people.dy;
        people.x += people.dx;
        people.y += people.dy;

        if (people.y > game.height * 2) {
            people.state = 'dead';
            people.movement_state = 'dead';
        }
        switch (people.movement_state) {
            case 'ascending':
                if ((people.orientation == 'left' && people.x < people.mate.x) || (people.orientation == 'right' && people.x > people.mate.x)) {
                    if (distance(people, people.mate) > 3 * game.peoples.radius) {
                        people.orientation = people.orientation == 'left' ? 'right' : 'left';
                        people.dx = (people.orientation == 'left' ? -1 : 1) * game.peoples.run_velocity;
                    }
                }
                people.dy -= 0.1;
                if (people.y < -game.height) {
                    people.state = 'ascended';
                    people.movement_state = 'dead';
                    people.mate.state = 'ascended';
                    people.mate.movement_state = 'dead';
                }
                break;
            case 'falling':
                var people_bottom = people.y + game.peoples.radius;
                for (var j = 0; j < game.platforms.list.length; ++j) {
                    var platform = game.platforms.list[j];
                    if (people.dy > 0 && people.x >= platform.x_min && people.x < platform.x_max && people_bottom >= platform.y && people.y - people.dy <= platform.y) {
                        people.dx = (people.orientation == 'left' ? -1 : 1) * (people.state == "following_mate" ? game.peoples.run_velocity : game.peoples.walk_velocity);
                        people.dy = 0;
                        people.y = platform.y - game.peoples.radius;
                        people.movement_state = 'walking';
                        people.platform = platform;
                        break;
                    }
                }
                break;
            case 'walking':
                if (people.x < people.platform.x_min || people.x >= people.platform.x_max) {
                    if (people.state == 'following_mate' && people.mate.y > people.y) {
                        people.movement_state = 'falling';
                        people.platform = null;
                        break;
                    } else {
                        people.orientation = people.orientation == 'left' ? 'right' : 'left';
                        people.dx = (people.orientation == 'left' ? -1 : 1) * (people.state == "following_mate" ? game.peoples.run_velocity : game.peoples.walk_velocity);
                    }
                }

                if (people.state == 'following_mate') {
                    if ((people.orientation == 'left' && people.x < people.mate.x) || (people.orientation == 'right' && people.x > people.mate.x)) {
                        if (distance(people, people.mate) > 3 * game.peoples.radius) {
                            people.orientation = people.orientation == 'left' ? 'right' : 'left';
                            people.dx = (people.orientation == 'left' ? -1 : 1) * game.peoples.run_velocity;
                        }
                    }
                    if ((people.mate.movement_state == 'walking' && people.mate.y < people.y) || people.mate.y < people.y - game.platforms.height * 2) {
                        people.dy = -Math.min(game.peoples.jump_velocity, 0.2 * (people.y - people.mate.y));
                        people.movement_state = 'falling';
                        people.platform = null;
                        break;
                    }
                }

                if (people.state == 'selecting_mate' && game.time - people.select_time > 2.0) {
                    var is_the_lowest = true;
                    for (j = 0; j < game.peoples.list.length; ++j) {
                        other_people = game.peoples.list[j];
                        if (other_people != people && other_people.movement_state != 'dead' && (other_people.y > people.y || other_people.state != 'selecting_mate')) {
                            is_the_lowest = false;
                            break;
                        }
                    }
                    if (is_the_lowest) {
                        people.orientation = Math.random() > 0.5 ? 'left' : 'right';
                        people.dx = (people.orientation == 'left' ? -1 : 1) * game.peoples.run_velocity;
                        people.dy = -game.peoples.jump_velocity;
                        people.movement_state = 'falling';
                        people.platform = null;
                        break;
                    }
                }

                for (j = 0; j < people.platform.jumpers.length; ++j) {
                    var jumper = people.platform.jumpers[j];
                    if (people.x > jumper - game.platforms.jumper_width * 0.25 && people.x < jumper + game.platforms.jumper_width * 0.25) {
                        people.dy = -game.peoples.jump_velocity;
                        people.movement_state = 'falling';
                        people.platform = null;
                        break;
                    }
                }
                break;
        }

        switch (people.state) {
            case 'wandering':
                var people_distance = distance(people, game.cursor.position);
                if (people_distance < nearest_people_distance) {
                    nearest_people_distance = people_distance;
                    nearest_people = people;
                }
                break;
            case 'selecting_mate':
                var animation = Math.min(unlerp(game.time - people.select_time, 0, 0.5), 1);
                var start_angle = people.fov_center + game.peoples.fov_angle * -0.5;
                var stop_angle = people.fov_center + game.peoples.fov_angle * 0.5;
                if (start_angle < 0) {
                    start_angle += Math.PI * 2;
                    stop_angle += Math.PI * 2;
                }
                people.fov_radius = lerp(animation, game.peoples.radius, game.peoples.fov_radius);
                for (j = 0; j < game.peoples.list.length; ++j) {
                    var other_people = game.peoples.list[j];
                    if (other_people != people) {
                        if (distance(people, other_people) < people.fov_radius) {
                            var angle = Math.atan2(other_people.y - people.y, other_people.x - people.x);
                            if (angle <= 0)
                                angle += Math.PI * 2;
                            if (angle > start_angle && angle < stop_angle) {
                                people.mate = other_people;
                                people.mate_time = game.time;
                                people.state = 'following_mate';
                                break;
                            }
                        }
                    }
                }
                break;
            case 'following_mate':
                if (people.mate.state == 'dead' || people.mate.state == 'ascended') {
                    people.state = 'wandering';
                    people.mate = null;
                    break;
                }
                if (people.mate.state == 'following_mate' && people.mate.mate == people && distance(people, people.mate) < 2 * game.peoples.radius) {
                    if (people.movement_state == 'walking' && people.mate.movement_state == 'walking') {
                        people.ascention_time = game.time;
                        people.mate.ascention_time = game.time;
                        people.movement_state = 'ascending';
                        people.mate.movement_state = 'ascending';
                    }
                }
                break;
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
                if (arrow.target && arrow.target.state == 'wandering' && arrow.z <= game.arrows.far) {
                    var dx = arrow.target.x - arrow.x + arrow.target.dx * game.arrows.prediction_force;
                    var dy = arrow.target.y - arrow.y + arrow.target.dy * game.arrows.prediction_force;
                    arrow.dx += game.arrows.tracking_force * dx;
                    arrow.dy += game.arrows.tracking_force * dy;
                    arrow.dx *= 1 - game.arrows.xy_friction;
                    arrow.dy *= 1 - game.arrows.xy_friction;
                }
                if (arrow.z >= game.arrows.far && arrow.z < game.arrows.far + game.arrows.z_velocity * 2) {
                    if (arrow.target && arrow.target.state == 'wandering' && distance(arrow, arrow.target) < game.peoples.radius + game.arrows.radius) {
                        arrow.state = 'attached';
                        arrow.z = game.arrows.far;
                        arrow.target.state = 'selecting_mate';
                        arrow.target.select_time = game.time;
                        arrow.attach_time = game.time;
                    }
                    // TODO: get stuck on platforms
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
                if (arrow.state != 'flying' && distance(previous, trail) + (Math.abs(trail.z - previous.z) * 200) < 3)
                    trail.state = 'locked';
            } else {
                trail.x += arrow.target.previous_dx;
                trail.y += arrow.target.previous_dy;
            }
            previous = trail;
        }

        if (arrow.z > game.arrows.far * 4 || (arrow.state == 'attached' && game.time - arrow.attach_time > 0.4)) {
            game.arrows.list.splice(i, 1);
            --i;
        }
    }

    if (game.cursor.just_released) {
        var z_factor = game.arrows.z_velocity / (game.arrows.far - game.arrows.near);
        var x_variance = (Math.pow(Math.random() * 2 - 1, 5)) * 6;
        var y_variance = (Math.pow(Math.random() * 2 - 1, 5)) * 6;
        game.arrows.list.push({
            state: 'flying',
            x: game.width * 0.5 - x_variance,
            y: game.height * 0.5 - y_variance,
            z: game.arrows.near,
            dx: (game.cursor.position.x + x_variance * 10 - game.width * 0.5) * z_factor,
            dy: (game.cursor.position.y + y_variance * 10 - game.height * 0.5 - game.arrows.gravity_compensation) * z_factor,
            target: game.cursor.selected_people,
            trail: [{x: game.width * 0.5, y: game.height * 0.5, z: game.arrows.near, state: 'tracking'}]
        });
    }

    var everybody_is_gone = true;
    for (i = 0; i < game.peoples.list.length; ++i) {
        people = game.peoples.list[i];
        if (people.state != 'dead' && people.state != 'ascended') {
            everybody_is_gone = false;
            break;
        }
    }
    if (everybody_is_gone == true) {
        game.current_level = (game.current_level + 1) % game.levels.length;
        init_level(game, game.levels[game.current_level]);
    }

    game.cursor.just_pressed = false;
    game.cursor.just_released = false;
    game.time += 1 / game.tick_fps;
}