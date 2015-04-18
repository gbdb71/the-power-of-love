var ld32 = {
    time: 0,
    tick_fps: 60,
    width: 640,
    height: 320,
    cursor: {
        radius: 5,
        max_select_distance: 100,
        color: '#000',
        people_color: '#000',
        just_pressed: false,
        just_released: false,
        pressed: false,
        selected_people: null,
        position: {
            x: -1,
            y: -1
        }
    },
    current_level: 0,
    levels: [],
    background_color: '#f4eeee',
    platforms: {
        height: 20,
        jumper_width: 20,
        jumper_height: 2,
        background_color: '#a45040',
        list: []
    },
    peoples: {
        radius: 10,
        select_radius: 4,
        fov_radius: 140,
        fov_angle: Math.PI * 0.3,
        gravity: 20,
        jump_velocity: 10,
        walk_velocity: 1,
        run_velocity: 2,
        falling_friction: {x: 0.01, y: 0.01},
        colors: {
            fov: 'rgba(60, 0, 0, 0.1)',
            selected: 'rgba(90, 90, 140, 0.5)',
            falling: '#000',
            walking: '#000',
            ascending: '#f7bd13'
        },
        list: []
    },
    arrows: {
        radius: 2,
        tracking_force: 0.07,
        prediction_force: 4,
        xy_friction: 0.15,
        z_velocity: 0.025,
        gravity: 0.1,
        gravity_compensation: 88,
        near: 0.01,
        far: 1,
        list: []
    }
};