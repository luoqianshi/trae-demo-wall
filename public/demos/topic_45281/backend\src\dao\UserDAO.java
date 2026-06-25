package dao;

import bean.User;
import java.util.List;

public interface UserDAO {
    int insert(User user);
    int update(User user);
    int delete(int id);
    User findById(int id);
    User findByUsername(String username);
    List<User> findAll();
    List<User> findByRole(String role);
}
