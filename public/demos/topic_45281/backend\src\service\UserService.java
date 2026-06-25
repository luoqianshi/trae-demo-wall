package service;

import bean.User;
import dao.UserDAO;
import dao.impl.UserDAOImpl;
import java.util.List;
import org.mindrot.jbcrypt.BCrypt;

public class UserService {
    private UserDAO userDAO = new UserDAOImpl();

    public int addUser(User user) {
        user.setPassword(hashPassword(user.getPassword()));
        return userDAO.insert(user);
    }

    public int updateUser(User user) {
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(hashPassword(user.getPassword()));
        }
        return userDAO.update(user);
    }

    public int deleteUser(int id) {
        return userDAO.delete(id);
    }

    public User getUserById(int id) {
        return userDAO.findById(id);
    }

    public User getUserByUsername(String username) {
        return userDAO.findByUsername(username);
    }

    public List<User> getAllUsers() {
        return userDAO.findAll();
    }

    public List<User> getUsersByRole(String role) {
        return userDAO.findByRole(role);
    }

    public String hashPassword(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(12));
    }

    public boolean verifyPassword(String plainPassword, String storedPassword) {
        if (storedPassword == null) return false;
        if (storedPassword.startsWith("$2a$")) {
            try {
                return BCrypt.checkpw(plainPassword, storedPassword);
            } catch (Exception e) {
                return false;
            }
        }
        return plainPassword.equals(storedPassword);
    }
}
