import bcrypt from 'bcryptjs';

class UserStore {
    constructor() {
        this.users = new Map();        // Add test users
        this.addUser('test@example.com', 'wrongpassword');
        this.addUser('valid@example.com', 'correctpassword');
    }

    async addUser(email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        this.users.set(email, { email, password: hashedPassword });
    }

    async verifyUser(email, password) {
        const user = this.users.get(email);
        if (!user) return false;
        return await bcrypt.compare(password, user.password);
    }
}

const userStore = new UserStore();
export { userStore };
