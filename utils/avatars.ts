export const AVATARS = {
    bear_sleepy: require('../assets/avatars/avatar_bear_sleepy_1774231679936.png'),
    bunny_excited: require('../assets/avatars/avatar_bunny_excited_1774231726935.png'),
    cat_grumpy: require('../assets/avatars/avatar_cat_grumpy_1774231667648.png'),
    dog_happy: require('../assets/avatars/avatar_dog_happy_1774231655118.png'),
    fox_surprised: require('../assets/avatars/avatar_fox_surprised_1774231739609.png'),
    monkey_silly: require('../assets/avatars/avatar_monkey_silly_1774231692844.png'),
    owl_uninterested: require('../assets/avatars/avatar_owl_uninterested_1774231715426.png'),
    panda_content: require('../assets/avatars/avatar_panda_content_1774231798208.png'),
    penguin_cool: require('../assets/avatars/avatar_penguin_cool_1774231704878.png'),
    raccoon_curious: require('../assets/avatars/avatar_raccoon_curious_1774231766445.png'),
    tiger_angry: require('../assets/avatars/avatar_tiger_angry_1774231753755.png'),
};

export type AvatarId = keyof typeof AVATARS;

export const AVATAR_IDS = Object.keys(AVATARS) as AvatarId[];

// Default avatar for new profiles
export const DEFAULT_AVATAR: AvatarId = 'dog_happy';
