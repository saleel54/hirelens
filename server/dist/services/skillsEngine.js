"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSkills = exports.extractSkills = exports.SKILLS_DICTIONARY = void 0;
exports.SKILLS_DICTIONARY = {
    'React': /\b(react|reactjs|react\.js)\b/i,
    'Node.js': /\b(node|nodejs|node\.js)\b/i,
    'JavaScript': /\b(javascript|js|es6)\b/i,
    'PostgreSQL': /\b(postgres|postgresql)\b/i,
    'TypeScript': /\b(ts|typescript)\b/i,
    'Docker': /\b(docker)\b/i,
    'AWS': /\b(aws|amazon\s+web\s+services|ec2|s3|rds)\b/i,
    'Python': /\b(python|py|django|flask|fastapi)\b/i,
    'Java': /\b(java|spring|springboot)\b/i,
    'C++': /\b(c\+\+)\b/i,
    'HTML/CSS': /\b(html|html5|css|css3|sass|less)\b/i,
    'Git': /\b(git|github|gitlab|bitbucket)\b/i,
    'Kubernetes': /\b(k8s|kubernetes)\b/i,
    'MongoDB': /\b(mongo|mongodb)\b/i,
    'Redis': /\b(redis)\b/i,
    'GraphQL': /\b(graphql|gql)\b/i,
    'Next.js': /\b(next|nextjs|next\.js)\b/i,
    'Vue.js': /\b(vue|vuejs|vue\.js)\b/i,
    'Tailwind CSS': /\b(tailwind|tailwindcss)\b/i,
    'Express': /\b(express|expressjs|express\.js)\b/i,
    'CI/CD': /\b(ci\/cd|jenkins|circleci|github\s+actions)\b/i,
    'Linux': /\b(linux|ubuntu|debian|redhat|centos)\b/i,
};
/**
 * Extracts all matched skills from a given text string
 * @param text Content block to evaluate
 * @returns Array of unique skill names found
 */
const extractSkills = (text) => {
    const matched = [];
    for (const [skillName, regex] of Object.entries(exports.SKILLS_DICTIONARY)) {
        if (regex.test(text)) {
            matched.push(skillName);
        }
    }
    return matched;
};
exports.extractSkills = extractSkills;
/**
 * Compares resume skills against required JD skills
 * @param resumeText Extracted resume text
 * @param jdText Pasteable Job Description text
 * @returns Object holding lists of matched and missing skills
 */
const compareSkills = (resumeText, jdText) => {
    // 1. Identify what skills are required by the Job Description
    const requiredSkills = (0, exports.extractSkills)(jdText);
    // If no required skills are found in the JD, return empty matched and missing skills arrays
    // (the AI will evaluate dynamic semantic overlap later, preventing false-positive 100% matches here)
    if (requiredSkills.length === 0) {
        return {
            matchedSkills: [],
            missingSkills: []
        };
    }
    const matchedSkills = [];
    const missingSkills = [];
    // 2. Classify each required skill based on presence in the resume
    for (const skill of requiredSkills) {
        const regex = exports.SKILLS_DICTIONARY[skill];
        if (regex && regex.test(resumeText)) {
            matchedSkills.push(skill);
        }
        else {
            missingSkills.push(skill);
        }
    }
    return {
        matchedSkills,
        missingSkills
    };
};
exports.compareSkills = compareSkills;
